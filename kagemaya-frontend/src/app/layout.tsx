import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Kagemaya.id — Sinema 4D & Pengalaman Kreatif',
  description:
    'Platform kurasi tiket film sinema 4D interaktif, workshop seni visual, dan festival budaya kolaborasi sinema Indo-Jepang.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-kage-black text-kage-washi antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <div className="film-grain" />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
