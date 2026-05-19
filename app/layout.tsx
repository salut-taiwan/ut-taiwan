import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/Toast";
import SessionExpiryModal from "@/components/ui/SessionExpiryModal";
import Providers from "@/components/ui/Providers";
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
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased min-h-screen`}>
        <Providers>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
                <SessionExpiryModal />
                <a
                  href="https://wa.me/886936501760"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Hubungi kami via WhatsApp"
                  className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] transition-colors duration-200"
                >
                  <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.516.666 4.876 1.83 6.916L2 30l7.294-1.808A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.55 11.55 0 01-5.89-1.608l-.422-.25-4.33 1.074 1.1-4.22-.276-.434A11.56 11.56 0 014.4 16C4.4 9.59 9.59 4.4 16 4.4S27.6 9.59 27.6 16 22.41 27.6 16 27.6zm6.34-8.66c-.348-.174-2.06-1.016-2.38-1.132-.32-.116-.552-.174-.784.174-.232.348-.9 1.132-1.104 1.366-.202.232-.406.26-.754.086-.348-.174-1.468-.54-2.796-1.722-1.032-.922-1.73-2.06-1.932-2.408-.202-.348-.022-.536.152-.71.156-.154.348-.404.522-.606.174-.202.232-.348.348-.58.116-.232.058-.436-.028-.61-.088-.174-.784-1.89-1.074-2.588-.282-.68-.57-.588-.784-.598l-.668-.012c-.232 0-.61.086-.928.434-.32.348-1.218 1.19-1.218 2.9 0 1.71 1.246 3.362 1.42 3.594.174.232 2.452 3.742 5.942 5.248.83.358 1.478.572 1.982.732.834.264 1.592.226 2.192.138.668-.1 2.06-.842 2.35-1.656.29-.814.29-1.512.204-1.656-.086-.144-.318-.23-.666-.406z"/>
                  </svg>
                </a>
                <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-20 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">UT Taiwan</p>
                        <p className="mt-0.5 text-sm text-[var(--text-body)]">Layanan Pembelian Modul Mahasiswa Universitas Terbuka di Taiwan</p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Sentra Layanan Universitas Terbuka (SALUT) Taiwan</p>
                      </div>
                      <nav className="flex items-center gap-5 text-sm text-[var(--text-body)]">
                        <Link href="/program" className="hover:text-indigo-700 transition-colors duration-150">Program Studi</Link>
                        <Link href="/modules" className="hover:text-indigo-700 transition-colors duration-150">Semua Modul</Link>
                        <Link href="/packages" className="hover:text-indigo-700 transition-colors duration-150">Paket Semester</Link>
                        <Link href="/orders" className="hover:text-indigo-700 transition-colors duration-150">Pesanan</Link>
                        <Link href="/salut" className="hover:text-indigo-700 transition-colors duration-150">SALUT</Link>
                        <Link href="/profile" className="hover:text-indigo-700 transition-colors duration-150">Profil</Link>
                      </nav>
                    </div>
                  </div>
                </footer>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
