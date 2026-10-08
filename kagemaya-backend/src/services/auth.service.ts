import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import config from '../config';

const generateReferralCode = (name: string): string => {
  const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${randomStr}`;
};

// ... dilanjutkan fungsi registerUser & loginUser
// Pastikan fungsi di-export menggunakan kata kunci 'export'
export const registerUser = async (payload: z.infer<typeof registerSchema>) => {
  const { name, email, password, role, referredBy } = registerSchema.parse(payload);

  // 1. Cek email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar');
  }

  // 2. Hash password & buat referral code
  const hashedPassword = await bcrypt.hash(password, 10);
  const userReferralCode = generateReferralCode(name);

  // 3. Cek referral code pengajak
  let referrerUser = null;
  if (referredBy) {
    referrerUser = await prisma.user.findUnique({ where: { referral_code: referredBy } });
    if (!referrerUser) {
      throw new Error('Kode referral tidak valid');
    }
  }

  // 4. Eksekusi Transaction
  // WAJIB tambahkan kata kunci 'return' di depan prisma.$transaction
  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        referral_code: userReferralCode,
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

      // Pendaftar baru mendapat Kupon Diskon Referral
      await tx.coupon.create({
        data: {
          user_id: newUser.id,
          discount_amount: 25000,
          expires_at: expiresAt,
          is_used: false,
        },
      });
    }
    // WAJIB mengembalikan data user baru dari dalam callback transaction
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      referral_code: newUser.referral_code,
    };
  });
};

export const loginUser = async (payload: z.infer<typeof loginSchema>) => {
  // 1. Validasi input
  const { email, password } = loginSchema.parse(payload);

  // 2. Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Email atau password salah');
  }

  // 3. Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email atau password salah');
  }

  // 4. Generate JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );

  // 5. WAJIB RETURN OBJEK DATA (agar tidak null)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referral_code: user.referral_code,
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