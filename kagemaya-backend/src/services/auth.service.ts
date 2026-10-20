
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import config from '../config';

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';

import { sendResetPasswordEmail } from './email.service';


const generateReferralCode = (name: string): string => {
  const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${randomStr}`;
};

export const registerUser = async (payload: z.infer<typeof registerSchema>) => {
  const { name, email, password, role, referredBy } = registerSchema.parse(payload);

  // 1. Cek email unik
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
  }

  // 2. Hash password & buat referral code unik
  const hashedPassword = await bcrypt.hash(password, 10);
  const userReferralCode = generateReferralCode(name);

  // 3. Cek referral code pengajak
  let referrerUser = null;
  if (referredBy) {
    if (role === 'ORGANIZER') {
      throw new Error('Kode referral hanya berlaku untuk pendaftaran akun Penonton (Customer).');
    }

    referrerUser = await prisma.user.findUnique({ where: { referral_code: referredBy } });
    if (!referrerUser) {
      throw new Error('Kode referral tidak valid atau tidak ditemukan.');
    }
  }

  // 4. Eksekusi Transaction
  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        referral_code: userReferralCode,
        referred_by_id: referrerUser ? referrerUser.id : null,
      },
    });

    // Buat profil organizer otomatis jika role ORGANIZER
    if (role === 'ORGANIZER') {
      await tx.organizerProfile.create({
        data: {
          user_id: newUser.id,
          organization_name: name,
        },
      });
    }

    // Berikan reward jika menggunakan referral
    if (referrerUser) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      // Pemberi referral mendapat +10.000 Poin
      await tx.pointTransaction.create({
        data: {
          user_id: referrerUser.id,
          amount: 10000,
          remaining_amount: 10000,
          type: 'EARN',
          expires_at: expiresAt,
        },
      });

      // Pendaftar baru mendapat Kupon Diskon Referral Rp25.000
      await tx.coupon.create({
        data: {
          user_id: newUser.id,
          discount_amount: 25000,
          expires_at: expiresAt,
          is_used: false,
        },
      });
    }

    // Generate JWT token otomatis saat registrasi sukses
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        referral_code: newUser.referral_code,
      },
      token,
    };
  });
};

export const loginUser = async (payload: z.infer<typeof loginSchema>) => {
  // 1. Validasi input
  const { email, password } = loginSchema.parse(payload);

  // 2. Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Email atau password salah.');
  }

  // 3. Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email atau password salah.');
  }

  // 4. Generate JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referral_code: user.referral_code,
      profile_picture: user.profile_picture,
    },
    token,
  };
};

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      referral_code: true,
      created_at: true,
    },
  });
};

/**
 * FTRIN-002 - Forgot Password
 * Membuat token reset dan mengirim email.
 */
export const forgotPasswordUser = async (payload: unknown) => {
  // Validasi email
  const { email } = forgotPasswordSchema.parse(payload);

  // Pesan umum agar tidak mengungkap keberadaan akun
  const message =
    'Jika email terdaftar, tautan reset password akan dikirim.';

  // Cari pengguna tanpa membedakan huruf besar/kecil
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
  });

  // Jangan ungkap apakah email terdaftar
  if (!user) {
    return { message };
  }

  // Token acak 32 byte = 64 karakter hexadecimal
  const rawToken = randomBytes(32).toString('hex');

  // Hanya hash token yang disimpan di database
  const tokenHash = createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token berlaku selama 30 menit
  const expiresAt = new Date(
    Date.now() + 30 * 60 * 1000
  );

  // Nonaktifkan token lama dan simpan token baru
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    await tx.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  });

  // Buat tautan menuju frontend Kagemaya
  const resetUrl = new URL(
    '/reset-password',
    config.frontendUrl
  );

  resetUrl.searchParams.set('token', rawToken);


  // Kirim email melalui Nodemailer
  try {
    await sendResetPasswordEmail(
      user.email,
      resetUrl.toString()
    );
  } catch (error: unknown) {
    // Catat kegagalan tanpa menampilkan token
    // atau kredensial SMTP.
    const smtpError = error as {
  name?: string;
  code?: string;
  command?: string;
  responseCode?: number;
} | null;

console.error('FTRIN-002: SMTP delivery failed', {
  name: smtpError?.name ?? 'UnknownError',
  code: smtpError?.code ?? 'Tidak tersedia',
  command: smtpError?.command ?? 'Tidak tersedia',
  responseCode: smtpError?.responseCode ?? 'Tidak tersedia',
});

    // Nonaktifkan token yang gagal dikirim.
    try {
      await prisma.passwordResetToken.updateMany({
        where: {
          token_hash: tokenHash,
          used_at: null,
        },
        data: {
          used_at: new Date(),
        },
      });
    } catch (cleanupError: unknown) {
      console.error(
        'FTRIN-002: Token cleanup failed',
        cleanupError instanceof Error
          ? cleanupError.name
          : 'UnknownError'
      );
    }

    // Controller akan memberikan respons umum
    // agar keberadaan akun tidak terungkap.
    throw new Error('RESET_EMAIL_DELIVERY_FAILED');
  }


  return { message };
};

/**
 * FTRIN-002 - Reset Password
 * Validasi token dan perubahan password.
 */
export const resetPasswordUser = async (payload: unknown) => {
  // 1. Validasi input
  const { token, password } = resetPasswordSchema.parse(payload);

  // 2. Hash token reset
  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex');

  // 3. Cari token yang masih berlaku
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      user_id: true,
    },
  });

  if (!resetRecord) {
    throw new Error(
      'Token reset tidak valid atau sudah kedaluwarsa.'
    );
  }

  // 4. Hash password baru
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. Update password dalam database transaction
  await prisma.$transaction(async (tx) => {
    // Klaim token agar tidak dapat digunakan dua kali
    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      data: {
        used_at: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new Error(
        'Token reset tidak valid atau sudah digunakan.'
      );
    }

    // Perbarui password pengguna
    await tx.user.update({
      where: { id: resetRecord.user_id },
      data: { password: hashedPassword },
    });

    // Nonaktifkan token reset lainnya
    await tx.passwordResetToken.updateMany({
      where: {
        user_id: resetRecord.user_id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });
  });

  return {
    message: 'Password berhasil diperbarui. Silakan login kembali.',
  };
};
