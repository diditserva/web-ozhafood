'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, LayoutDashboard, ShoppingBag, Settings, ExternalLink } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function AdminNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Pesanan & Rekap Dapur', icon: ShoppingBag },
    { href: '/admin/products', label: 'Kelola Produk & Stok', icon: Utensils },
    { href: '/admin/settings', label: 'Divisi & Lokasi', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-glass)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              OZ
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-lg text-[var(--text-main)] font-[family-name:var(--font-heading)]">
                OZHA FOOD <span className="text-xs px-2 py-0.5 ml-1 rounded-full bg-amber-500/20 text-amber-500 font-semibold">ADMIN</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Portal Manajemen & Dapur</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-light)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500 transition-colors"
          >
            <span>Halaman Order</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex border-t border-[var(--border-color)] px-2 py-1.5 overflow-x-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
