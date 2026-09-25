'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  ExternalLink,
  Clock,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { formatRupiah } from '@/lib/constants';

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function AdminNotificationBell() {
  const {
    orders,
    unreadCount,
    pendingCount,
    soundEnabled,
    setSoundEnabled,
    permissionStatus,
    requestDesktopPermission,
    markAllAsRead,
    playTestSound,
  } = useAdminNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">PENDING</span>;
      case 'CONFIRMED':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">DITERIMA</span>;
      case 'COOKING':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">DIMASAK</span>;
      case 'COMPLETED':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SELESAI</span>;
      case 'CANCELLED':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400">BATAL</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all outline-none focus:outline-none shrink-0 btn-press ${
          isOpen
            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-light)]'
        }`}
        title="Notifikasi Pesanan"
        aria-label="Notifikasi Pesanan"
      >
        <Bell className="w-4 h-4" />

        {/* Unread badge / ping indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-black shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-[var(--border-color)] shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--accent-light)]/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                  Notifikasi Orderan
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {pendingCount} pesanan berstatus pending
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* Quick Settings: Sound & Desktop Notification */}
          <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Audio Toggle & Test */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-colors ${
                  soundEnabled
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
                title={soundEnabled ? 'Suara notifikasi aktif' : 'Suara notifikasi dibisukan'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Suara ON' : 'Muted'}</span>
              </button>

              {soundEnabled && (
                <button
                  type="button"
                  onClick={playTestSound}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border-color)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  title="Uji coba bunyikan lonceng pesanan"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Tes Nada</span>
                </button>
              )}
            </div>

            {/* Desktop Notification Request */}
            {permissionStatus !== 'granted' ? (
              <button
                type="button"
                onClick={requestDesktopPermission}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-colors"
                title="Izinkan notifikasi desktop browser"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Izin Pop-up</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Desktop Aktif</span>
              </span>
            )}
          </div>

          {/* Recent Orders List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)]">
            {orders.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto text-[var(--text-muted)]/40 mb-2" />
                <p className="text-xs font-semibold text-[var(--text-muted)]">Belum ada pesanan masuk.</p>
              </div>
            ) : (
              orders.slice(0, 6).map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="p-3 block hover:bg-[var(--accent-light)]/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[var(--text-main)]">
                        #{order.orderCode}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-main)] truncate max-w-[200px]">
                      {order.customerName}
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="truncate">{order.division} • {order.location}</span>
                    <span className="shrink-0">{order.items?.length || 0} menu</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2.5 bg-[var(--accent-light)]/30 border-t border-[var(--border-color)] text-center">
            <Link
              href="/admin/orders"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span>Buka Semua Pesanan di Rekap Dapur</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
