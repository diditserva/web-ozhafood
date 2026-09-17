'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, X, ArrowRight, Sparkles } from 'lucide-react';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { formatRupiah } from '@/lib/constants';

export default function AdminNotificationToast() {
  const { activeToast, dismissToast } = useAdminNotifications();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 10000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-2xl shadow-2xl shadow-[var(--accent)]/20 p-4 overflow-hidden relative">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] animate-pulse" />

        <div className="flex items-start gap-3.5">
          {/* Pulsing Icon */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
              <ShoppingBag className="w-5 h-5 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--accent)]"></span>
            </span>
          </div>

          {/* Body Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PESANAN BARU MASUK!</span>
            </div>
            <h4 className="font-extrabold text-sm text-[var(--text-main)] truncate mt-0.5">
              #{activeToast.orderCode} • {activeToast.customerName}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {activeToast.division} • {activeToast.location}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-black text-[var(--accent)] font-[family-name:var(--font-heading)]">
                {formatRupiah(activeToast.totalAmount)}
              </span>
              <Link
                href="/admin/orders"
                onClick={dismissToast}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all shadow-md shadow-[var(--accent)]/20 active:scale-95"
              >
                <span>Lihat Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={dismissToast}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg hover:bg-[var(--accent-light)] transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
