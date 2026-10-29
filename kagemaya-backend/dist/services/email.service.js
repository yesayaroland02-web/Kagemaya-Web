"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordEmail = exports.verifyEmailConnection = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
// SMTP Transporter - FTRIN-002
const transporter = nodemailer_1.default.createTransport({
    host: config_1.default.smtp.host,
    port: config_1.default.smtp.port,
    secure: config_1.default.smtp.secure,
    auth: {
        user: config_1.default.smtp.user,
        pass: config_1.default.smtp.pass,
    },
});
// Memeriksa koneksi dan autentikasi SMTP
const verifyEmailConnection = async () => {
    await transporter.verify();
    return true;
};
exports.verifyEmailConnection = verifyEmailConnection;
// Mengirim tautan reset password ke email pengguna
const sendResetPasswordEmail = async (email, resetUrl) => {
    return transporter.sendMail({
        from: config_1.default.smtp.from,
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
exports.sendResetPasswordEmail = sendResetPasswordEmail;
