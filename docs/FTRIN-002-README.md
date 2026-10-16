# FTRIN-002 — Forgot Password & Reset Password

- **Proyek:** Kagemaya.id
- **Branch:** `FTRIN-002-SMTP-Email-Integration`
- **Fitur:** Forgot Password & Reset Password menggunakan Gmail SMTP dan Nodemailer


## 1. Deskripsi Fitur

FTRIN-002 memungkinkan pengguna Kagemaya.id mengatur ulang password melalui tautan yang dikirim ke email terdaftar.

Alur utama:

1. Pengguna membuka halaman Login dan memilih **Lupa Password?**
2. Pengguna memasukkan alamat email.
3. Backend membuat token acak dan menyimpan hash token di PostgreSQL menggunakan Prisma.
4. Nodemailer mengirimkan tautan Reset Password melalui SMTP.
5. Pengguna membuka tautan dan mengisi password baru.
6. Backend memvalidasi token, memperbarui hash password dengan bcrypt, dan menonaktifkan token.
7. Pengguna login kembali menggunakan password baru.

## 2. Teknologi

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- Database: PostgreSQL pada Neon.
- ORM: Prisma.
- Email: Nodemailer dan SMTP.
- Keamanan: bcrypt, SHA-256, Zod, dan express-rate-limit.
- Version control: Git dan GitHub.

## 3. Struktur File Utama

**Backend:**

- `src/config/index.ts` — konfigurasi aplikasi dan SMTP.
- `src/routes/auth.router.ts` — endpoint autentikasi dan rate limiting.
- `src/controllers/auth.controller.ts` — penanganan request dan response.
- `src/validations/auth.validation.ts` — validasi input.
- `src/services/auth.service.ts` — logika Forgot Password dan Reset Password.
- `src/services/email.service.ts` — pengiriman email SMTP.
- `prisma/schema.prisma` — model database.

**Frontend:**

- `src/app/(auth)/login/page.tsx` — halaman login dan tautan Lupa Password.
- `src/app/(auth)/forgot-password/page.tsx` — permintaan tautan reset.
- `src/app/(auth)/reset-password/page.tsx` — formulir password baru.

## 4. Persiapan Lingkungan

Persyaratan:

- Node.js dan npm.
- Akses repository proyek.
- Kredensial database pengembangan yang diberikan tim.
- Konfigurasi SMTP yang disetujui tim.

**Backend:**

1. Masuk ke folder `kagemaya-backend`.
2. Jalankan `npm ci` untuk memasang dependensi berdasarkan lockfile.
3. Gunakan `.env.example` sebagai acuan pembuatan `.env`.
4. Isi konfigurasi lokal sesuai lingkungan pengembangan.
5. Jalankan `npm run dev`.

**Frontend:**

1. Masuk ke folder `kagemaya-frontend`.
2. Jalankan `npm ci`.
3. Gunakan `.env.example` sebagai acuan pembuatan `.env.local`.
4. Jalankan `npm run dev`.

Jangan menimpa konfigurasi lokal yang sudah digunakan oleh anggota tim.

## 5. Endpoint API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/forgot-password` | Meminta email reset password |
| POST | `/api/auth/reset-password` | Memperbarui password menggunakan token |
| POST | `/api/auth/login` | Login pengguna |
| POST | `/api/auth/register` | Registrasi pengguna |

Alamat backend pengembangan: `http://localhost:5000`.

Alamat frontend pengembangan: `http://localhost:3000`.

## 6. Ketentuan Keamanan

- Token dibuat menggunakan bilangan acak kriptografis.
- Database hanya menyimpan hash SHA-256 dari token.
- Masa berlaku token: 30 menit.
- Token lama dinonaktifkan saat token baru diminta.
- Token yang telah digunakan tidak dapat digunakan kembali.
- Password disimpan sebagai hash bcrypt.
- Rate limiting Forgot Password: maksimal 5 permintaan dalam 15 menit per alamat IP.
- Kegagalan pengiriman SMTP ditangani dan token pengiriman yang gagal dinonaktifkan.
- Respons Forgot Password tidak mengungkap apakah email pengguna terdaftar.

Rate limiting yang digunakan masih berbasis memori proses dan perlu disesuaikan jika aplikasi dijalankan pada beberapa instance backend.

## 7. Hasil Pengujian

Pengujian yang sudah berhasil:

- Koneksi dan pengiriman Gmail SMTP.
- Pendaftaran akun pengujian.
- Permintaan Forgot Password melalui API dan browser.
- Penyimpanan hash token di PostgreSQL.
- Reset Password melalui API dan browser.
- Login menggunakan password baru.
- Penolakan penggunaan ulang token.
- Rate limiting dengan HTTP 429 pada permintaan keenam.
- Simulasi kegagalan SMTP dan pembersihan token.
- Pemeriksaan TypeScript backend.
- Production build Next.js.

Pengujian kedaluwarsa token secara langsung, pembatasan pada beberapa server, dan pencabutan sesi JWT lama belum dinyatakan selesai.

## 8. Ketentuan Database Neon

FTRIN-002 menggunakan database pengembangan PostgreSQL yang digunakan bersama oleh tim.

- Tidak diperlukan reset database.
- Jangan menjalankan `prisma migrate reset`.
- Jangan menghapus tabel atau mengubah role Neon tanpa koordinasi.
- Model `PasswordResetToken` telah tersedia dan berhasil digunakan.
- Perubahan struktur database di masa mendatang harus dibahas dengan penanggung jawab proyek.

## 9. Keamanan Git dan Kredensial

File `.env` backend pernah terlacak dalam repository Git dan mengandung kredensial yang memerlukan rotasi.

- Jangan mengunggah `.env`, `.env.local`, App Password, JWT Secret, atau connection string rahasia.
- Gunakan `.env.example` hanya sebagai template.
- Koordinasikan rotasi kredensial lama dan penanganan riwayat Git dengan pengelola repository.
- Sebelum menarik perubahan yang menghapus `.env` dari Git, anggota tim harus mengamankan konfigurasi lokal masing-masing.
- Jangan push atau merge perubahan yang berisiko memperlihatkan kredensial sebelum penanganan keamanan disepakati.

## 10. Status Serah Terima

Implementasi dan pengujian fungsional utama FTRIN-002 sudah selesai.

Pekerjaan yang masih harus ditindaklanjuti:

- Pemeriksaan akhir konfigurasi dan dokumentasi.
- Pengamanan kredensial yang pernah masuk ke Git.
- Pemeriksaan oleh reviewer tim.
- Commit, push, dan Pull Request setelah persetujuan keamanan.
- Pengujian tambahan untuk kesiapan produksi.