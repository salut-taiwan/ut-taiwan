'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { FeesConfig } from '@/lib/api'
import { TOKO_CATEGORIES } from '@/lib/toko-categories'
import { cn } from '@/lib/utils'

// ─── Animation config ──────────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
}

const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

// ─── Static data ───────────────────────────────────────────────────────────

const faculties = [
  {
    code: 'FEB',
    name: 'Ekonomi dan Bisnis',
    programs: '7 Program Studi',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    topBorder: '#0A4595',
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
    topBorder: '#059669',
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
    topBorder: '#D97706',
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
    topBorder: '#7C3AED',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
      </svg>
    ),
  },
]

const featurePillars = [
  {
    title: 'Modul Kuliah',
    desc: 'Cari & beli modul per kode TBO Karunika',
    href: '/modules',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    topBorder: '#0A4595',
    colSpan: 'wide' as const,
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
    topBorder: '#059669',
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
    topBorder: '#D97706',
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
    topBorder: '#0D9488',
    colSpan: 'wide' as const,
    accentCard: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-7.5L3 9l6-1 3-6z" />
      </svg>
    ),
  },
]

const salutBenefits = [
  'Biaya layanan dibebaskan untuk anggota',
  'Jas almamater & jaket eksklusif',
  'Fasilitas ujian online & offline',
  'Eligibility untuk beasiswa SALUT',
]

const steps = [
  { step: '1', title: 'Pilih Item', desc: 'Modul, paket per semester, atau merchandise' },
  { step: '2', title: 'Tambah ke Keranjang', desc: 'Atur jumlah dan varian sebelum checkout' },
  { step: '3', title: 'Checkout', desc: 'Isi alamat pengiriman ke Taiwan' },
  { step: '4', title: 'Bayar & Terima', desc: 'Bayar via transfer, item dikirim ke Taiwan' },
]

const infoCards = [
  {
    title: 'Pengiriman ke Taiwan',
    desc: 'Pengiriman langsung ke alamat Anda di Taiwan.',
    cardClass: 'bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-l-4 border-l-indigo-400 p-6 h-full',
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
    cardClass: 'bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-t-4 border-t-amber-400 p-6 h-full',
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
    cardClass: 'bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-l-4 border-l-emerald-400 p-6 h-full',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
  },
]

const stats = [
  { num: '400+', label: 'Anggota Aktif' },
  { num: '1.000+', label: 'Modul Tersedia' },
  { num: '4', label: 'Fakultas UT' },
]

// ─── Component ─────────────────────────────────────────────────────────────

export default function HomePageContent({ fees }: { fees: FeesConfig | null }) {
  const nextRenewalDisplay = fees?.salutMembership.renewalPolicy.next_renewal_date_display ?? null

  return (
    <div>
      {/* SALUT renewal banner */}
      {nextRenewalDisplay && (
        <section className="bg-teal-50 border-y border-teal-200 px-4 sm:px-6 lg:px-8 py-3">
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

      {/* ── Hero ── */}
      <section
        className="relative mb-0 overflow-hidden text-white px-4 sm:px-6 lg:px-8 py-24"
        style={{ background: '#04204A' }}
      >
        {/* Campus photo base layer */}
        <Image
          fill
          src="/images/Foto-gedung.jpg"
          alt=""
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* Indigo gradient overlay — keeps text readable, especially on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#04204A] via-[#04204A]/95 to-[#0A4595]/80" />
        {/* Aurora animation layer */}
        <div
          className="absolute inset-0 mix-blend-overlay opacity-60"
          style={{
            background: 'linear-gradient(135deg, #04204A 0%, #0A4595 25%, #1E3A8A 50%, #083A7E 75%, #062E66 100%)',
            backgroundSize: '400% 400%',
            animation: 'aurora 14s ease infinite',
          }}
        />
        {/* Subtle grain overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }} />

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div variants={heroItem} className="mb-6">
            <span className="inline-flex items-center gap-2 bg-amber-400 text-indigo-900 text-xs font-bold uppercase tracking-[0.08em] px-4 py-1.5 rounded-full">
              Komunitas · Modul · Merchandise
            </span>
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-5"
          >
            Kuliah UT di Taiwan,{' '}
            <br className="hidden sm:block" />
            beres dari satu tempat.
          </motion.h1>

          <motion.p variants={heroItem} className="text-lg text-indigo-100/90 max-w-2xl mx-auto mb-10">
            Modul, paket per semester, merchandise resmi, dan keanggotaan SALUT. Semua di sini.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/program"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 hover:-translate-y-0.5 transition-[background-color,transform] duration-200 active:scale-[0.98] shadow-[0_2px_4px_rgba(10,69,149,0.12),0_8px_24px_rgba(10,69,149,0.18)]"
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
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="-mt-6 relative z-10 bg-amber-400 py-8 mb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {stats.map(({ num, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-900 tabular-nums">{num}</div>
              <div className="text-xs sm:text-sm font-semibold text-indigo-800 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature pillars ── */}
      <section className="pt-4 pb-8 mb-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-3">Layanan kami</h2>
            <p className="text-base text-[var(--text-body)] max-w-xl mx-auto">Satu platform untuk semua kebutuhan kuliah UT di Taiwan.</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {featurePillars.map((p, i) => (
              <motion.div
                key={p.href}
                variants={cardReveal}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                className={cn("hover-shadow-lift rounded-2xl", p.colSpan === 'wide' && "sm:col-span-2")}
              >
                <Link
                  href={p.href}
                  className={cn(
                    "group block rounded-2xl border border-[var(--border-subtle)] border-t-[6px] p-7 h-full relative overflow-hidden",
                    p.accentCard ? "bg-teal-50/80" : "bg-[var(--surface)]"
                  )}
                  style={{ borderTopColor: p.topBorder }}
                >
                  {/* Decorative number watermark */}
                  <span className="absolute top-3 right-5 text-[5.5rem] font-black text-[var(--foreground)] opacity-[0.04] select-none pointer-events-none tabular-nums leading-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className={`w-14 h-14 ${p.iconBg} ${p.iconColor} rounded-2xl flex items-center justify-center mb-5`}>
                    <span className="w-7 h-7">{p.icon}</span>
                  </div>
                  <div className={cn("font-extrabold text-[var(--foreground)] mb-2", p.colSpan === 'wide' ? "text-xl" : "text-lg")}>
                    {p.title}
                  </div>
                  <div className="text-sm text-[var(--text-body)] leading-relaxed mb-5">{p.desc}</div>
                  <div
                    className="flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 group-hover:gap-1.5 transition-all duration-200"
                    style={{ color: p.topBorder }}
                  >
                    Lihat
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Faculty selection ── */}
      <section className="mb-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">Pilih fakultas</h2>
          <p className="text-sm text-[var(--text-body)]">Mulai dari fakultas Anda untuk menemukan modul.</p>
        </motion.div>
        <div className="-mx-4 sm:-mx-6 lg:mx-0 overflow-x-clip">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex gap-3 overflow-x-auto pb-3 pt-2 px-4 sm:px-6 lg:px-0"
        >
          {faculties.map(f => (
            <motion.div
              key={f.code}
              variants={cardReveal}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
              className="hover-shadow-lift rounded-2xl flex-none w-36 sm:flex-1 sm:w-auto"
            >
              <Link
                href={`/program?faculty=${f.code}`}
                className="group flex flex-col bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] border-t-4 p-5 h-full text-center"
                style={{ borderTopColor: f.topBorder }}
              >
                <div className={`text-3xl font-black ${f.iconColor} mb-1 leading-none`}>{f.code}</div>
                <div className="font-semibold text-[var(--foreground)] text-xs leading-snug mb-1.5">{f.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-auto">{f.programs}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* ── SALUT spotlight (bold redesign) ── */}
      <section className="mb-16 bg-teal-600 px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Decorative watermark */}
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none select-none" aria-hidden="true">
          <span className="text-[7rem] sm:text-[9rem] font-black text-white/[0.06] leading-none tracking-tight pr-6 translate-x-6">
            SALUT
          </span>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-teal-900 text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700 inline-block" />
              400+ Anggota Aktif
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-3">SALUT: layanan lebih mudah, per semester.</h2>
            <ul className="space-y-2 mb-4">
              {salutBenefits.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-teal-100">
                  <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs italic text-teal-200/80">
              <strong className="text-teal-100">Keanggotaan SALUT berakhir</strong> setiap <strong className="text-teal-100">1 Mei</strong> dan <strong className="text-teal-100">1 November</strong>. Perpanjangan wajib dilakukan setiap semester.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="flex flex-col gap-3 lg:min-w-56"
          >
            {/* Community photo card */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <Image fill src="/images/salut.jpg" alt="Komunitas SALUT UT Taiwan" className="object-cover object-top" sizes="(max-width: 1024px) 100vw, 280px" />
              <div className="absolute bottom-3 right-3 bg-amber-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                400+ Anggota Aktif
              </div>
            </div>
            {/* Warm terracotta CTA — Von Restorff effect on teal background */}
            <Link
              href="/salut/apply"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-[background-color] duration-200 shadow-[var(--shadow-sm)] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--warm)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--warm-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--warm)' }}
            >
              Daftar SALUT
            </Link>
            <Link
              href="/salut"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 hover:border-white/60 transition-[background-color,border-color] duration-200"
            >
              Pelajari Lebih Lanjut
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Toko spotlight ── */}
      <section className="mb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-[var(--foreground)]">Merchandise resmi UT Taiwan</h2>
        </motion.div>
        {/* Editorial image strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { src: '/images/foto-almamater.jpeg', label: 'Jas Almamater', href: '/toko?category=jas-almamater' },
            { src: '/images/jaket.jpg',            label: 'Jaket Resmi',   href: '/toko?category=jaket' },
            { src: '/images/aksesoris.webp',       label: 'Aksesoris',     href: '/toko?category=aksesoris' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative rounded-2xl overflow-hidden aspect-[3/4]"
              >
                <Image fill src={item.src} alt={item.label} className="object-cover" sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 300px" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white font-semibold text-sm">{item.label}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          className="flex flex-wrap gap-2 justify-center mb-4"
        >
          {TOKO_CATEGORIES.filter(c => c.key !== '').map(c => (
            <Link
              key={c.key}
              href={`/toko?category=${c.key}`}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-full text-sm font-semibold text-[var(--text-body)] hover:border-indigo-300 hover:text-indigo-700 hover:-translate-y-0.5 transition-[border-color,color,transform] duration-150 shadow-[var(--shadow-sm)]"
            >
              {c.label}
            </Link>
          ))}
        </motion.div>
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

      {/* ── How it works ── */}
      <section className="bg-[var(--surface-sunken)] px-4 sm:px-6 lg:px-8 py-16 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Cara pemesanan</h2>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8 text-center relative"
        >
          <div className="hidden sm:block absolute top-7 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[var(--border)] pointer-events-none" />
          {steps.map(item => (
            <motion.div key={item.step} variants={cardReveal} className="relative flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-indigo-900 text-xl font-bold flex items-center justify-center mb-4 shadow-[var(--shadow-md)] relative z-10">
                {item.step}
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--text-body)]">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Info cards ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {infoCards.map(item => (
          <motion.div
            key={item.title}
            variants={cardReveal}
            className="hover-shadow-lift rounded-2xl"
          >
            <div className={item.cardClass}>
              <div className={`w-10 h-10 ${item.iconBg} ${item.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                <span className="w-5 h-5">{item.icon}</span>
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--text-body)]">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Panduan CTA ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden relative"
      >
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
      </motion.section>
      </div>
    </div>
  )
}
