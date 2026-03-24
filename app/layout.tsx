import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/Toast";
import SessionExpiryModal from "@/components/ui/SessionExpiryModal";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toko Modul Kuliah Universitas Terbuka Taiwan",
  description: "Temukan dan beli modul kuliah UT sesuai program studi Anda. Mahasiswa UT di Taiwan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} antialiased bg-slate-50 min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
              <SessionExpiryModal />
              <footer className="bg-white border-t border-slate-100 mt-20 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-base font-semibold text-slate-800">UT Taiwan</p>
                      <p className="mt-0.5 text-sm text-slate-500">Layanan Pembelian Modul Mahasiswa Universitas Terbuka di Taiwan</p>
                      <p className="mt-0.5 text-xs text-slate-400">Sentra Layanan Universitas Terbuka (SALUT) Taiwan</p>
                    </div>
                    <nav className="flex items-center gap-5 text-sm text-slate-500">
                      <Link href="/program" className="hover:text-indigo-700 transition-colors duration-150">Program Studi</Link>
                      <Link href="/modules" className="hover:text-indigo-700 transition-colors duration-150">Semua Modul</Link>
                      <Link href="/packages" className="hover:text-indigo-700 transition-colors duration-150">Paket Semester</Link>
                      <Link href="/orders" className="hover:text-indigo-700 transition-colors duration-150">Pesanan</Link>
                    </nav>
                  </div>
                </div>
              </footer>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
