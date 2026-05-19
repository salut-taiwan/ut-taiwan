import Link from 'next/link';

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

const steps = [
  { step: '1', title: 'Pilih Program', desc: 'Pilih fakultas dan program studi Anda' },
  { step: '2', title: 'Pilih Modul', desc: 'Pilih modul per semester atau satu per satu' },
  { step: '3', title: 'Checkout', desc: 'Isi alamat pengiriman ke Taiwan' },
  { step: '4', title: 'Bayar & Terima', desc: 'Bayar via transfer bank, modul dikirim ke Taiwan' },
];

const infoCards = [
  {
    title: 'Harga Mahasiswa',
    desc: 'Dapatkan harga khusus mahasiswa UT untuk pembelian pertama setiap kode mata kuliah',
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
    title: 'Pengiriman ke Taiwan',
    desc: 'Kami mengurus pengiriman langsung ke alamat Anda di Taiwan',
    accent: 'border-l-indigo-400',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92V19a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h2.09a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L5.3 7.59a16 16 0 006.07 6.07l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.84v2.08z" />
      </svg>
    ),
  },
  {
    title: 'Modul Selalu Update',
    desc: 'Data modul diperbarui otomatis dari TBO Karunika setiap hari',
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

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-16 overflow-hidden bg-[var(--primary)] text-white px-4 sm:px-6 lg:px-8 py-24">
        {/* Radial glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(250,218,2,0.08),transparent)] pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-800/30 rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-caps bg-white/15 border border-white/20 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full mb-6">
            Sentra Layanan Resmi UT Taiwan
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-5">
            Temukan Modul Kuliah{' '}<br className="hidden sm:block" />
            Sesuai Program Studi
          </h1>
          <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto mb-10">
            Beli bahan ajar Universitas Terbuka dengan mudah. Pilih program studi, lihat modul per semester, dan pesan langsung dari Taiwan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/program"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.20)] transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] shadow-[0_2px_4px_rgba(10,69,149,0.12),0_8px_24px_rgba(10,69,149,0.18)]">
              Pilih Program Studi
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/modules"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-white/10 hover:border-white/60 transition-[background-color,border-color] duration-200 active:scale-[0.98]">
              Cari Modul
            </Link>
          </div>
        </div>
      </section>

      {/* Faculty Selection */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-caps text-indigo-600">Mulai dari sini</span>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mt-2 mb-2">Pilih Fakultas</h2>
          <p className="text-[var(--text-body)]">Mulai dari fakultas Anda untuk menemukan modul yang tepat</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {faculties.map(f => (
            <Link key={f.code} href={`/program?faculty=${f.code}`}
              className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 text-center transition-[box-shadow,transform] duration-200 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] cursor-pointer">
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

      {/* How it works */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-8 mb-16">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-caps text-indigo-600">Proses mudah & cepat</span>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mt-2">Cara Pemesanan</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center relative">
          {/* Dashed connector (desktop only) */}
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
          <div key={item.title}
            className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-l-4 ${item.accent} shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 p-6`}>
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
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-2 block">Sumber daya resmi</span>
            <h2 className="text-2xl font-bold mb-2">Butuh Panduan UT?</h2>
            <p className="text-indigo-100/90 text-sm max-w-md">
              Login eCampus, registrasi mata kuliah, cara bayar SPP, hingga panduan ujian online — semua tersedia di sini.
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
