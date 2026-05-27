import Link from 'next/link';
import type { FeesConfig } from '@/lib/api';
import { TOKO_CATEGORIES } from '@/lib/toko-categories';

async function getFees(): Promise<FeesConfig | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/fees`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const faculties = [
  {
    code: 'FEB',
    name: 'Ekonomi dan Bisnis',
    programs: '7 Program Studi',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 4-4" />
      </svg>
    ),
  },
  {
    code: 'FHISIP',
    name: 'Hukum, Ilmu Sosial & Politik',
    programs: '11 Program Studi',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l9 4.5V12c0 5-3.6 9.7-9 11-5.4-1.3-9-6-9-11V7.5L12 3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    code: 'FKIP',
    name: 'Keguruan & Ilmu Pendidikan',
    programs: '12 Program Studi',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    code: 'FST',
    name: 'Sains dan Teknologi',
    programs: '8 Program Studi',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
      </svg>
    ),
  },
];

const featurePillars = [
  {
    title: 'Modul Kuliah',
    desc: 'Cari & beli modul per kode TBO Karunika',
    href: '/modules',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Paket Modul',
    desc: 'Paket per semester yang sudah dikurasi',
    href: '/packages',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    title: 'Toko UT Taiwan',
    desc: 'Merchandise resmi: jas almamater, jaket, dan aksesoris',
    href: '/toko',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2l1.5 4h9L18 2" />
        <path d="M3 6h18l-1.5 14a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 6z" />
        <path d="M9 11a3 3 0 006 0" />
      </svg>
    ),
  },
  {
    title: 'Keanggotaan SALUT',
    desc: 'Bebas biaya layanan & benefit eksklusif',
    href: '/salut',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-7.5L3 9l6-1 3-6z" />
      </svg>
    ),
  },
];

const salutBenefits = [
  'Biaya layanan dibebaskan untuk anggota',
  'Jas almamater & jaket eksklusif',
  'Fasilitas ujian online & offline',
  'Eligibility untuk beasiswa SALUT',
];

const steps = [
  { step: '1', title: 'Pilih Item', desc: 'Modul, paket per semester, atau merchandise' },
  { step: '2', title: 'Tambah ke Keranjang', desc: 'Atur jumlah dan varian sebelum checkout' },
  { step: '3', title: 'Checkout', desc: 'Isi alamat pengiriman ke Taiwan' },
  { step: '4', title: 'Bayar & Terima', desc: 'Bayar via transfer, item dikirim ke Taiwan' },
];

const infoCards = [
  {
    title: 'Pengiriman ke Taiwan',
    desc: 'Pengiriman langsung ke alamat Anda di Taiwan.',
    accent: 'border-l-indigo-400',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h13v10H3z" />
        <path d="M16 10h4l3 3v4h-7" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </svg>
    ),
  },
  {
    title: 'Harga Mahasiswa + SALUT',
    desc: 'Harga khusus mahasiswa UT. Anggota SALUT: biaya layanan nol.',
    accent: 'border-l-amber-400',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v2m0 8v2M9.5 9.5A2.5 2.5 0 0112 8a2.5 2.5 0 010 5 2.5 2.5 0 000 5 2.5 2.5 0 002.5-1.5" />
      </svg>
    ),
  },
  {
    title: 'Data selalu segar',
    desc: 'Modul disinkronkan dari TBO Karunika setiap hari. Stok toko diperbarui berkala.',
    accent: 'border-l-emerald-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
  },
];

export default async function Home() {
  const fees = await getFees();
  const nextRenewalDisplay = fees?.salutMembership.renewalPolicy.next_renewal_date_display ?? null;

  return (
    <div>
      {/* SALUT renewal banner (BE-sourced date) */}
      {nextRenewalDisplay && (
        <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-8 bg-teal-50 border-y border-teal-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <p className="text-teal-800">
              <strong>Keanggotaan SALUT berakhir</strong> setiap <strong>1 Mei</strong> dan <strong>1 November</strong>. Perpanjangan berikutnya: <span className="font-semibold">{nextRenewalDisplay}</span>.
            </p>
            <Link
              href="/salut/apply"
              className="shrink-0 inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-sm whitespace-nowrap transition-colors"
            >
              Daftar / perpanjang
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className={`relative -mx-4 sm:-mx-6 lg:-mx-8 ${nextRenewalDisplay ? '' : '-mt-8'} mb-16 overflow-hidden bg-[var(--primary)] text-white px-4 sm:px-6 lg:px-8 py-24`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(250,218,2,0.08),transparent)] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-800/30 rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-caps bg-white/15 border border-white/20 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full mb-6">
            Sentra Layanan Universitas Terbuka Taiwan
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-5">
            Kuliah UT di Taiwan,{' '}<br className="hidden sm:block" />
            beres dari satu tempat.
          </h1>
          <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto mb-10">
            Modul, paket per semester, merchandise resmi, dan keanggotaan SALUT. Semua di sini.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/program"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.20)] transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] shadow-[0_2px_4px_rgba(10,69,149,0.12),0_8px_24px_rgba(10,69,149,0.18)]"
            >
              Pilih Program Studi
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/toko"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-white/10 hover:border-white/60 transition-[background-color,border-color] duration-200 active:scale-[0.98]"
            >
              Jelajah Toko
            </Link>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">Layanan kami</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featurePillars.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 transition-[box-shadow,transform] duration-200 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] cursor-pointer"
            >
              <div className={`w-12 h-12 ${p.iconBg} ${p.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                <span className="w-6 h-6">{p.icon}</span>
              </div>
              <div className="font-bold text-[var(--foreground)] mb-1.5">{p.title}</div>
              <div className="text-sm text-[var(--text-body)] leading-snug">{p.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Faculty selection */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2">Pilih fakultas</h2>
          <p className="text-[var(--text-body)]">Mulai dari fakultas Anda untuk menemukan modul.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {faculties.map(f => (
            <Link
              key={f.code}
              href={`/program?faculty=${f.code}`}
              className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 text-center transition-[box-shadow,transform] duration-200 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] cursor-pointer"
            >
              <div className={`w-12 h-12 ${f.iconBg} ${f.iconColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <span className="w-6 h-6">{f.icon}</span>
              </div>
              <div className="font-bold text-[var(--foreground)] text-sm mb-1">{f.code}</div>
              <div className="font-semibold text-[var(--text-body)] mb-2 text-sm leading-snug">{f.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{f.programs}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* SALUT spotlight */}
      <section className="mb-16 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-caps text-teal-700">Keanggotaan eksklusif</span>
            <h2 className="text-3xl font-bold text-teal-900 mt-2 mb-3">SALUT: layanan lebih mudah, per semester.</h2>
            <ul className="space-y-2 mb-4">
              {salutBenefits.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-teal-900">
                  <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs italic text-teal-800/80">
              <strong>Keanggotaan SALUT berakhir</strong> setiap <strong>1 Mei</strong> dan <strong>1 November</strong>. Perpanjangan wajib dilakukan setiap semester.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:min-w-56">
            <Link
              href="/salut/apply"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
            >
              Daftar SALUT
            </Link>
            <Link
              href="/salut"
              className="inline-flex items-center justify-center gap-2 border-2 border-teal-300 text-teal-800 font-semibold px-6 py-3 rounded-xl hover:bg-teal-100 transition-colors"
            >
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </section>

      {/* Toko spotlight */}
      <section className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">Merchandise resmi UT Taiwan</h2>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {TOKO_CATEGORIES.filter(c => c.key !== '').map(c => (
            <Link
              key={c.key}
              href={`/toko?category=${c.key}`}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-full text-sm font-semibold text-[var(--text-body)] hover:border-indigo-300 hover:text-indigo-700 hover:-translate-y-0.5 transition-[border-color,color,transform] duration-150 shadow-[var(--shadow-sm)]"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/toko"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-7.5L3 9l6-1 3-6z" />
            </svg>
            Khusus SALUT: jaket gratis untuk semester 1
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">Cara pemesanan</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center relative">
          <div className="hidden sm:block absolute top-7 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[var(--border)] pointer-events-none" />
          {steps.map(item => (
            <div key={item.step} className="relative flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-xl font-bold flex items-center justify-center mb-4 shadow-[var(--shadow-md)] relative z-10">
                {item.step}
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--text-body)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {infoCards.map(item => (
          <div
            key={item.title}
            className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-l-4 ${item.accent} shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 p-6`}
          >
            <div className={`w-10 h-10 ${item.iconBg} ${item.iconColor} rounded-xl flex items-center justify-center mb-4`}>
              <span className="w-5 h-5">{item.icon}</span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
            <p className="text-sm text-[var(--text-body)]">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Panduan section */}
      <section className="mb-16 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Butuh panduan UT?</h2>
            <p className="text-indigo-100/90 text-sm max-w-md">
              Login eCampus, registrasi mata kuliah, cara bayar SPP, panduan ujian online. Semua di satu halaman.
            </p>
          </div>
          <Link
            href="/panduan"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 hover:-translate-y-px transition-[background-color,transform] duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          >
            Lihat Semua Panduan
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
