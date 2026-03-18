import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth";
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
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <SessionExpiryModal />
          <footer className="border-t border-slate-200 mt-16 py-10 text-center text-sm text-slate-500 bg-white">
            <p className="font-medium text-slate-700">Layanan Pembelian Modul Mahasiswa Universitas Terbuka di Taiwan</p>
            <p className="mt-1 text-slate-400">Sentra Layanan Universitas Terbuka (SALUT) Taiwan</p>
          </footer>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
