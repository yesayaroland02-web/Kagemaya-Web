# 影と幻 — KAGEMAYA.ID DESIGN SYSTEM & VISUAL ANCHORS PACKAGE

> **"Di balik bayangan, ilusi menjadi nyata."**  
> Identitas Brand: **Cinematic Japanese Noir + Indonesian Warmth**  
> Referensi Spesifikasi: **PRD v1.1** & **`desain kagemaya-id prompt.txt`**

---

## 🚀 Panduan Membuka Prototype

1. Buka berkas **`index.html`** di browser Anda untuk melihat **Master Prototype Hub & Sitemap Interaktif**.
2. Dari sana, Anda dapat langsung mengklik tombol **"Buka Beranda Utama (Landing Page)"** atau memilih modul mana pun yang ingin diuji.
3. Seluruh alur (Guest, Customer, dan Organizer) telah saling terhubung secara fungsional.

---

## 📂 Struktur Berkas dalam Paket Ini

### 1. Fondasi Desain & Komponen Global
* **`kagemaya-tokens.css`**: Master stylesheet CSS mandiri (palet warna 60-25-10-5, tipografi, reset, styling tombol, badge, form, dan kartu).
* **`kagemaya-modals.html`**: Kumpulan template dialog modal (`<template>` tag: Confirm, Delete, Cancel, Accept/Reject).
* **`kagemaya-toasts.html`**: Kumpulan template toast notifications (`<template>` tag: Success, Warning, Error, Info).

### 2. Alur Pengunjung & Pelanggan (Customer Flow)
* **`kagemaya-landing-page-visual-anchor.html`**: Beranda sinematik utama.
* **`kagemaya-event-discovery.html`**: Katalog event & pencarian ("Temukan Event").
* **`kagemaya-event-detail.html`**: Halaman detail event (*Center of Gravity UX*).
* **`kagemaya-checkout.html`**: Pemesanan tiket, voucher, kupon diskon, dan saldo poin.
* **`kagemaya-transaction-payment.html`**: Instruksi bayar, hitung mundur 2 jam, dan upload bukti transfer.
* **`kagemaya-transaction-status.html`**: Mesin 6 status transaksi interaktif (*waiting_payment, waiting_confirmation, done, rejected, expired, canceled*).
* **`kagemaya-wishlist.html`**: Halaman event favorit tersimpan.
* **`kagemaya-organizer-profile.html`**: Profil publik penyelenggara acara & tombol follow.
* **`kagemaya-qa-wall.html`**: Forum diskusi Q&A dengan pinning jawaban resmi organizer.
* **`kagemaya-review.html`**: Formulir ulasan bintang 1–5 pasca-event.

### 3. Autentikasi & Akun Pengguna
* **`kagemaya-login.html`**: Halaman masuk dengan showcase split sinematik & modal lupa sandi.
* **`kagemaya-register.html`**: Registrasi dengan pemilih peran Customer vs Organizer (kepatuhan aturan PRD: field referral code muncul pada Customer dan hilang pada Organizer).
* **`kagemaya-user-profile.html`**: Profil akun customer, kode referral pribadi, saldo poin, dan kupon.

### 4. Portal Manajemen Penyelenggara (Organizer Flow)
* **`kagemaya-organizer-dashboard.html`**: Ringkasan KPI dan grafik penjualan organizer.
* **`kagemaya-organizer-create-event.html`**: Form pembuatan event, upload banner 16:9, dan konfigurasi dinamis tier tiket dengan invarian `EVENTS.available_seats`.
* **`kagemaya-organizer-transactions.html`**: Manajemen verifikasi transaksi pelanggan & modal preview bukti transfer m-Banking.
* **`kagemaya-organizer-attendees.html`**: Daftar hadir peserta resmi (khusus transaksi berstatus `DONE`).
* **`kagemaya-organizer-vouchers.html`**: Manajemen pembuatan voucher diskon per-event.

---

## 🎨 Token Desain Kunci
* **Kage Black**: `#0B0B0D` (Latar belakang dominan 60%)
* **Yoru**: `#121216` (Permukaan kartu dan panel)
* **Yoru Light**: `#1C1C22` (Modals, dropdown, hover surfaces)
* **Torii Red**: `#C62828` (Primary Action & CTA)
* **Vermilion**: `#E5484D` (Hover state & aksen hangat)
* **Maya Gold**: `#D6A85F` (Aksen premium, rating, tag khusus)
* **Washi**: `#F4F0E8` (Teks utama & judul)
* **Mist**: `#B8B5B0` (Teks sekunder & deskripsi)
* **Border**: `#292930` (Hairline border & divider)
* **Radius**: Restrained `2px` / `4px`
