
import nodemailer from 'nodemailer';
import config from '../config';

// SMTP Transporter - FTRIN-002
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Memeriksa koneksi dan autentikasi SMTP
export const verifyEmailConnection = async (): Promise<boolean> => {
  await transporter.verify();
  return true;
};

// Mengirim tautan reset password ke email pengguna
export const sendResetPasswordEmail = async (
  email: string,
  resetUrl: string
) => {
  return transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset Password - Kagemaya.id',
    text: `Halo,

Kami menerima permintaan untuk mengatur ulang password akun Kagemaya.id Anda.

Silakan buka tautan berikut:

${resetUrl}

Jika Anda tidak meminta perubahan password, abaikan email ini.

Salam,
Tim Kagemaya.id`,
  });
};
