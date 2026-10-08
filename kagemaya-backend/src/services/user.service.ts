import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

// ========================================
// GET MY PROFILE
// ========================================

export const getMyProfileService = async (
  userId: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      referral_code: true,
      referred_by_id: true,
      created_at: true,

      organizer_profile: {
        select: {
          organization_name: true,
          bio: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  return user;
};

// ========================================
// UPDATE PROFILE
// ========================================

export const updateProfileService = async (
  userId: string,
  data: {
    name?: string;
    profile_picture?: string;
  }
) => {
  if (!data.name && !data.profile_picture) {
    throw new Error('Tidak ada data yang diubah.');
  }

  const updated = await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      ...(data.name
        ? {
            name: data.name,
          }
        : {}),

      ...(data.profile_picture
        ? {
            profile_picture: data.profile_picture,
          }
        : {}),
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      referral_code: true,
      created_at: true,
    },
  });

  return updated;
};

// ========================================
// UPDATE PASSWORD
// ========================================

export const updatePasswordService = async (
  userId: string,
  data: {
    current_password: string;
    new_password: string;
  }
) => {
  const {
    current_password,
    new_password,
  } = data;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  // Cek password lama
  const isMatch = await bcrypt.compare(
    current_password,
    user.password
  );

  if (!isMatch) {
    throw new Error(
      'Password saat ini tidak sesuai.'
    );
  }

  // Password baru tidak boleh sama
  const isSame = await bcrypt.compare(
    new_password,
    user.password
  );

  if (isSame) {
    throw new Error(
      'Password baru tidak boleh sama dengan password saat ini.'
    );
  }

  // Hash password baru
  const hashedNewPassword = await bcrypt.hash(
    new_password,
    10
  );

  await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      password: hashedNewPassword,
    },
  });

  return {
    message: 'Password berhasil diperbarui.',
  };
};