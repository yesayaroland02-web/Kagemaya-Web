import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['CUSTOMER', 'ORGANIZER']).default('CUSTOMER'),
  referredBy: z.string().optional(), // Kode referral pengajak (opsional)
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Format email tidak valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string()
    .regex(/^[a-f0-9]{64}$/i, 'Token reset tidak valid'),

  password: z.string()
    .min(6, 'Password minimal 6 karakter'),

  confirmPassword: z.string()
    .min(1, 'Konfirmasi password wajib diisi'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  }
);
