'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Utensils, LayoutDashboard, ShoppingBag, Settings, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AdminNotificationBell from './AdminNotificationBell';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari panel admin?')) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Pesanan & Dapur', icon: ShoppingBag },
    { href: '/admin/products', label: 'Kelola Menu', icon: Utensils },
    { href: '/admin/settings', label: 'Divisi & Lokasi', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-glass)] backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group outline-none focus:outline-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center shadow-md shadow-[var(--accent)]/20 text-white font-black text-sm tracking-wider group-hover:scale-105 transition-transform shrink-0">
            OZ
          </div>
          <div className="shrink-0 flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[var(--text-main)] font-[family-name:var(--font-heading)]">
                OZHA FOOD
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)] font-bold uppercase tracking-wider leading-none">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-1 leading-none hidden xl:block">
              Portal Manajemen & Dapur
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0 ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-light)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--border-glow)] hover:bg-[var(--accent-light)] transition-all whitespace-nowrap outline-none focus:outline-none shrink-0"
            title="Buka Halaman Pemesanan Pelanggan"
          >
            <span>Web Order</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
          <AdminNotificationBell />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-9 px-3 rounded-xl border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 whitespace-nowrap outline-none focus:outline-none shrink-0"
            title="Keluar dari Panel Admin"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <LogOut className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex border-t border-[var(--border-color)] px-3 py-2 overflow-x-auto gap-1.5 items-center justify-between bg-[var(--bg-glass)]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors outline-none focus:outline-none ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-light)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 shrink-0 outline-none focus:outline-none"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
