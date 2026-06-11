'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useChat } from '@/components/chat/ChatProvider'
import TypingIndicator from '@/components/chat/TypingIndicator'

const conversationContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3, delayChildren: 0.2 } },
}

const bubbleReveal = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 26 } },
}

const assistantTopics = [
  'Info modul, harga, dan stok',
  'Cara pemesanan & pengiriman ke Taiwan',
  'Keanggotaan SALUT & panduan UT',
]

// Deep-blue spotlight section that introduces the AI assistant. Purely
// presentational: the scripted bubbles are display copy only, and the CTAs
// just call the same open() / link to /chat that ChatLauncher already uses.
export default function AssistantSpotlight() {
  const { open } = useChat()

  return (
    <section
      className="mb-16 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative overflow-hidden text-white"
      style={{ background: '#04204A' }}
    >
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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
        {/* Copy + CTAs */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-indigo-900 text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-3">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l1.9 5.7a2 2 0 001.3 1.3L21 11l-5.8 1.9a2 2 0 00-1.3 1.3L12 20l-1.9-5.8a2 2 0 00-1.3-1.3L3 11l5.8-2a2 2 0 001.3-1.3L12 2z" />
            </svg>
            Baru - Asisten AI
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
            Ada pertanyaan? Tanya Asisten UT Taiwan.
          </h2>
          <p className="text-indigo-100/90 mb-5 max-w-md">
            Asisten chat kami siap menjawab kapan saja, 24/7 - tanpa perlu menunggu balasan admin.
          </p>
          <ul className="space-y-2 mb-8">
            {assistantTopics.map(t => (
              <li key={t} className="flex items-start gap-2 text-sm text-indigo-100">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Warm terracotta CTA - Von Restorff effect on deep blue background */}
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-[background-color] duration-200 shadow-[var(--shadow-sm)] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--warm)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--warm-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--warm)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mulai Chat Sekarang
            </button>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 hover:border-white/60 transition-[background-color,border-color] duration-200"
            >
              Buka Halaman Chat
            </Link>
          </div>
        </motion.div>

        {/* Chat preview card - clicking anywhere opens the real chat */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <motion.button
            type="button"
            onClick={open}
            aria-label="Mulai chat dengan Asisten UT Taiwan"
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
            whileTap={{ scale: 0.99 }}
            className="block w-full max-w-md mx-auto text-left cursor-pointer rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-xl)] overflow-hidden"
          >
            {/* Header - mirrors the real chat panel */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
              <div className="relative shrink-0">
                <Image
                  src="/images/cs.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-400"
                />
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" />
              </div>
              <div>
                <div className="font-bold text-[var(--foreground)] leading-tight">Asisten UT Taiwan</div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  Online - balas dalam hitungan detik
                </div>
              </div>
            </div>

            {/* Scripted conversation preview */}
            <motion.div
              variants={conversationContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="px-5 py-5 space-y-3 bg-[var(--surface-sunken)]"
            >
              <motion.div variants={bubbleReveal} className="ml-auto w-fit max-w-[85%] bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md">
                Halo! Gimana cara pesan modul dari Taiwan?
              </motion.div>
              <motion.div variants={bubbleReveal} className="w-fit max-w-[85%] bg-[var(--surface)] text-[var(--text-body)] text-sm px-4 py-2.5 rounded-2xl rounded-bl-md shadow-[var(--shadow-xs)]">
                Halo! Gampang - pilih modulnya, isi alamatmu di Taiwan, lalu bayar. Modul dikirim langsung ke kotamu. 😊
              </motion.div>
              <motion.div variants={bubbleReveal} className="ml-auto w-fit max-w-[85%] bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md">
                Kalau mau daftar SALUT gimana?
              </motion.div>
              <motion.div variants={bubbleReveal} className="w-fit bg-[var(--surface)] px-4 py-2.5 rounded-2xl rounded-bl-md shadow-[var(--shadow-xs)]">
                <TypingIndicator />
              </motion.div>
            </motion.div>

            {/* Faux input bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-[var(--border-subtle)]">
              <span className="flex-1 text-sm text-[var(--text-muted)]">Tulis pertanyaanmu…</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </motion.button>
          <p className="text-xs text-indigo-200/70 text-center mt-3">
            Pratinjau percakapan - klik untuk mulai chat sungguhan.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
