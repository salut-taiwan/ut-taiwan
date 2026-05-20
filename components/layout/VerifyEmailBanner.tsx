'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  if (!user || user.is_verified !== false) return null;

  async function handleResend() {
    if (!user) return;
    setSending(true);
    try {
      await api.auth.resendVerification(user.email);
      showToast('Email verifikasi telah dikirim. Cek inbox Anda.', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Gagal mengirim email verifikasi.', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span>
          <strong>Email belum diverifikasi.</strong> Cek inbox <span className="font-mono">{user.email}</span> untuk link verifikasi.
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="underline font-semibold hover:text-amber-700 disabled:opacity-50 disabled:no-underline"
        >
          {sending ? 'Mengirim...' : 'Kirim ulang'}
        </button>
      </div>
    </div>
  );
}
