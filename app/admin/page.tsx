'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ScraperRunDTO } from '@/types';

const adminCards = [
  {
    href: '/admin/scraper',
    title: 'Scraper',
    desc: 'Kelola sinkronisasi data TBO Karunika',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    href: '/admin/modules',
    title: 'Manajemen Modul',
    desc: 'Lihat dan kelola data modul',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/packages',
    title: 'Manajemen Paket',
    desc: 'Buat dan kelola paket semester',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    title: 'Pesanan & Pembayaran',
    desc: 'Lihat pesanan dan konfirmasi pembayaran',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    title: 'Manajemen Mahasiswa',
    desc: 'Daftar mahasiswa dan kelola status SALUT',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/salut-applications',
    title: 'Permohonan SALUT',
    desc: 'Verifikasi permohonan keanggotaan SALUT',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [recentRun, setRecentRun] = useState<ScraperRunDTO | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.scraper.getRuns().then(runs => {
        if (runs.length > 0) setRecentRun(runs[0]);
      });
    }
  }, [user]);

  if (isLoading) return <div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Panel Admin</span>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mt-1">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminCards.map(card => (
          <Link key={card.href} href={card.href}
            className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 p-5">
            <div className={`w-12 h-12 ${card.iconBg} ${card.iconColor} rounded-xl flex items-center justify-center mb-3`}>
              <span className="w-6 h-6">{card.icon}</span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-indigo-700 transition-colors duration-150">{card.title}</h3>
            <p className="text-sm text-[var(--text-body)] mt-1">{card.desc}</p>
            {card.href === '/admin/scraper' && recentRun && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Terakhir: {formatDate(recentRun.started_at)} · {recentRun.status}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
