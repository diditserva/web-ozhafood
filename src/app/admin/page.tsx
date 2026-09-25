'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Utensils,
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  MapPin,
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/constants';

export default function AdminDashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/reports', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleNewOrder = () => {
      fetchDashboardData();
    };
    window.addEventListener('ozha:new-order', handleNewOrder);
    return () => {
      window.removeEventListener('ozha:new-order', handleNewOrder);
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[var(--text-muted)]">Memuat data dashboard...</p>
      </div>
    );
  }

  const summary = reportData?.summary || { totalRevenue: 0, totalOrdersCount: 0, totalProductsCount: 0 };
  const kitchenPortions = reportData?.kitchenPortions || [];
  const ordersByDate = reportData?.ordersByTargetDate || [];
  const divisionStats = reportData?.divisionStats || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-[var(--accent)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ozha Food Operational Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)]">
            Ringkasan Penjualan & Dapur
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Pantau pesanan masuk, jumlah porsi yang harus dimasak, dan performa omzet.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="px-5 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 transition-all btn-press shimmer-effect shrink-0"
        >
          <span>Buka Rekap Dapur Lengkap</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <Link
          href="/admin/orders"
          className="glass-card p-5 flex items-center justify-between card-interactive hover:border-emerald-500/40 group block cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Total Omzet
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(summary.totalRevenue)}
            </div>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              Akumulasi pesanan aktif
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600 dark:text-emerald-400" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Link>

        {/* Total Pesanan */}
        <Link
          href="/admin/orders"
          className="glass-card p-5 flex items-center justify-between card-interactive hover:border-amber-500/40 group block cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Total Pesanan
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-amber-600 dark:text-amber-400 mt-1">
              {summary.totalOrdersCount} Pesanan
            </div>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              Transaksi tersimpan di database
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600 dark:text-amber-400" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-115 group-hover:-rotate-6 transition-transform duration-300">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Link>

        {/* Variasi Menu */}
        <Link
          href="/admin/products"
          className="glass-card p-5 flex items-center justify-between card-interactive hover:border-rose-500/40 group block cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Menu Terdaftar
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-rose-600 dark:text-rose-400 mt-1">
              {summary.totalProductsCount ?? 0} Produk
            </div>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              Kelola menu & produk
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-rose-600 dark:text-rose-400" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300">
            <Utensils className="w-6 h-6" />
          </div>
        </Link>

        {/* Tanggal Terjadwal */}
        <Link
          href="/admin/orders"
          className="glass-card p-5 flex items-center justify-between card-interactive hover:border-sky-500/40 group block cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Jadwal Pengiriman
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-sky-600 dark:text-sky-400 mt-1">
              {ordersByDate.length} Batch Tanggal
            </div>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              Lihat jadwal & batch
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-600 dark:text-sky-400" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:scale-115 group-hover:-rotate-6 transition-transform duration-300">
            <Calendar className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* 2-Column Section: Kitchen Portion Summary & Top Division Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (7 cols): Rekap Porsi Menu yang harus dibuat */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card p-6 card-interactive">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-heading)]">
                  Total Porsi per Menu yang Harus Dimasak
                </h2>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 btn-press"
              >
                Detail Harian <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {kitchenPortions.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                Belum ada pesanan masuk.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {kitchenPortions.map((item: any) => (
                  <div
                    key={item.name}
                    className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between hover:border-rose-500/30 btn-press cursor-default transition-all"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-main)]">{item.name}</h3>
                      <span className="text-xs text-[var(--text-muted)]">
                        Nilai: {formatRupiah(item.revenue)}
                      </span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-base font-[family-name:var(--font-heading)]">
                      {item.quantity} porsi
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule List */}
          <div className="glass-card p-6 card-interactive">
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-heading)]">
                Jadwal Batch Pemesanan Terdekat
              </h2>
            </div>

            {ordersByDate.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">Belum ada jadwal.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {ordersByDate.slice(0, 5).map((row: any) => (
                  <Link
                    key={row.date}
                    href={`/admin/orders?targetDate=${row.date}`}
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-sky-500/40 flex items-center justify-between btn-press transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-sm font-bold text-[var(--text-main)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {formatDateIndo(row.date)}
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.count} Pesanan • {row.itemsCount} Total Porsi
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-heading)]">
                        {formatRupiah(row.revenue)}
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform inline-block">Buka Pesanan &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (5 cols): Division Orders & Fast Navigation */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Divisi Breakdown */}
          <div className="glass-card p-6 card-interactive">
            <div className="flex items-center gap-2.5 mb-4">
              <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-heading)]">
                Pesanan per Divisi
              </h2>
            </div>

            {divisionStats.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">Belum ada data.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {divisionStats.map((div: any) => (
                  <div
                    key={div.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-primary)] text-xs border border-[var(--border-color)] btn-press cursor-default hover:border-amber-500/30 transition-all"
                  >
                    <span className="font-semibold text-[var(--text-main)]">{div.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                      {div.count} order
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Admin Actions */}
          <div className="glass-card p-6 flex flex-col gap-3 card-interactive">
            <h2 className="text-base font-bold font-[family-name:var(--font-heading)] mb-1">
              Menu Cepat Admin
            </h2>

            <Link
              href="/admin/products"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent)] flex items-center justify-between text-xs font-bold btn-press transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <span>Atur Ketersediaan Menu (Aktif/Habis)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-[var(--accent)] transition-all" />
            </Link>

            <Link
              href="/admin/settings"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent)] flex items-center justify-between text-xs font-bold btn-press transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <span>Kelola Daftar Divisi & Lokasi Antar</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-[var(--accent)] transition-all" />
            </Link>

            <Link
              href="/"
              target="_blank"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent)] flex items-center justify-between text-xs font-bold btn-press transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <span>Buka Formulir Pemesanan Customer</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-[var(--accent)] transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
