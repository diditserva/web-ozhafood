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

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/admin/reports');
        const json = await res.json();
        if (json.success) {
          setReportData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[var(--text-muted)]">Memuat data dashboard...</p>
      </div>
    );
  }

  const summary = reportData?.summary || { totalRevenue: 0, totalOrdersCount: 0 };
  const kitchenPortions = reportData?.kitchenPortions || [];
  const ordersByDate = reportData?.ordersByTargetDate || [];
  const divisionStats = reportData?.divisionStats || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-amber-500">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold mb-2">
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
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <span>Buka Rekap Dapur Lengkap</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-amber-500 mt-1">
              {formatRupiah(summary.totalRevenue)}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Akumulasi pesanan aktif</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-[var(--text-main)] mt-1">
              {summary.totalOrdersCount} Pesanan
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Transaksi tersimpan di database</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Variasi Menu */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Menu Terdaftar
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-[var(--text-main)] mt-1">
              {kitchenPortions.length} Produk
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Menu yang pernah dipesan</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        {/* Tanggal Terjadwal */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Jadwal Pengiriman
            </span>
            <div className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-[var(--text-main)] mt-1">
              {ordersByDate.length} Batch Tanggal
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Variasi target date</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2-Column Section: Kitchen Portion Summary & Top Division Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (7 cols): Rekap Porsi Menu yang harus dibuat */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-amber-500" />
                <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-heading)]">
                  Total Porsi per Menu yang Harus Dimasak
                </h2>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
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
                    className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-main)]">{item.name}</h3>
                      <span className="text-xs text-[var(--text-muted)]">
                        Nilai: {formatRupiah(item.revenue)}
                      </span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold text-base font-[family-name:var(--font-heading)]">
                      {item.quantity} porsi
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule List */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="w-5 h-5 text-purple-500" />
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
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-amber-500 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="text-sm font-bold text-[var(--text-main)]">
                          {formatDateIndo(row.date)}
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.count} Pesanan • {row.itemsCount} Total Porsi
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-amber-500 font-[family-name:var(--font-heading)]">
                        {formatRupiah(row.revenue)}
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">Buka Pesanan &rarr;</span>
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
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Building2 className="w-5 h-5 text-emerald-500" />
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
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-primary)] text-xs border border-[var(--border-color)]"
                  >
                    <span className="font-semibold text-[var(--text-main)]">{div.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
                      {div.count} order
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Admin Actions */}
          <div className="glass-card p-6 flex flex-col gap-3">
            <h2 className="text-base font-bold font-[family-name:var(--font-heading)] mb-1">
              Menu Cepat Admin
            </h2>

            <Link
              href="/admin/products"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-amber-500 flex items-center justify-between text-xs font-bold transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span>Atur Ketersediaan Menu (Aktif/Habis)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Link>

            <Link
              href="/admin/settings"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-amber-500 flex items-center justify-between text-xs font-bold transition-all"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Kelola Daftar Divisi & Lokasi Antar</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Link>

            <Link
              href="/"
              target="_blank"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-amber-500 flex items-center justify-between text-xs font-bold transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-purple-500" />
                <span>Buka Formulir Pemesanan Customer</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
