import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
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
              <footer className="border-t border-slate-200/60 mt-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent">
                        UT Taiwan
                      </span>
                    </div>
                    <p className="font-medium text-slate-700 mb-1">
                      Layanan Pembelian Modul Mahasiswa Universitas Terbuka di Taiwan
                    </p>
                    <p className="text-sm text-slate-400">
                      Sentra Layanan Universitas Terbuka (SALUT) Taiwan
                    </p>
                    <div className="flex items-center gap-6 mt-6 text-sm text-slate-500">
                      <span>Harga Khusus Mahasiswa</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Pengiriman ke Taiwan</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Update Harian</span>
                    </div>
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
