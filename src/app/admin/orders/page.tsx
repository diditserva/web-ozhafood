'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  ShoppingBag,
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Flame,
  CheckCheck,
  XCircle,
  Utensils,
  RefreshCw,
  Building2,
  MapPin,
  FileText,
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/constants';

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  division: string;
  location: string;
  targetDate: string;
  notes: string | null;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COOKING' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(searchParams.get('targetDate') || '');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set('targetDate', selectedDate);
      if (selectedDivision) params.set('division', selectedDivision);
      if (selectedStatus) params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedDivision, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh when a new order arrives
  useEffect(() => {
    const handleNewOrder = () => {
      fetchOrders();
    };
    window.addEventListener('ozha:new-order', handleNewOrder);
    return () => {
      window.removeEventListener('ozha:new-order', handleNewOrder);
    };
  }, [fetchOrders]);

  // Update Status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Kitchen Portion Summary Calculation
  const kitchenPortions = useMemo(() => {
    const summary: Record<string, number> = {};
    orders
      .filter((o) => o.status !== 'CANCELLED')
      .forEach((o) => {
        o.items.forEach((it) => {
          summary[it.productName] = (summary[it.productName] || 0) + it.quantity;
        });
      });
    return Object.entries(summary).map(([name, qty]) => ({ name, qty }));
  }, [orders]);

  // Total summary for current filter
  const totalOmzetFiltered = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  // Export to Excel
  const handleExportExcel = () => {
    if (orders.length === 0) return;

    const dataToExport = orders.map((o, idx) => {
      const itemsListStr = o.items
        .map((it) => `${it.productName} (${it.quantity}x)`)
        .join(', ');

      return {
        No: idx + 1,
        'No. Order': `#${o.orderCode}`,
        'Nama Pemesan': o.customerName,
        Divisi: o.division,
        'Lokasi Antar': o.location,
        'Tanggal Pesanan Dibuatkan': new Date(o.targetDate).toLocaleDateString('id-ID'),
        'Daftar Menu': itemsListStr,
        'Catatan Khusus': o.notes || '-',
        'Total Pembayaran (Rp)': o.totalAmount,
        'Metode Bayar': o.paymentMethod,
        'Status Pesanan': o.status,
        'Waktu Submit Form': new Date(o.createdAt).toLocaleString('id-ID'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Pesanan');

    const filename = `Rekap_OzhaFood_${selectedDate || 'SemuaTanggal'}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Menunggu Bayar
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" /> Dikonfirmasi
          </span>
        );
      case 'COOKING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Flame className="w-3 h-3" /> Sedang Dimasak
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)]">
            <CheckCheck className="w-3 h-3" /> Selesai / Diantar
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-8 print:p-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)]">
            Pesanan & Rekap Dapur
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Lihat rincian porsi yang harus dimasak dan ubah status pesanan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-xs font-bold hover:border-[var(--accent)] transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-xs font-bold flex items-center gap-1.5 hover:border-[var(--accent)] transition-all"
          >
            <Printer className="w-4 h-4 text-[var(--accent)]" />
            <span>Cetak Rekap Dapur</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[var(--accent)]/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KITCHEN PORTION SUMMARY CARD */}
      <div className="glass-card p-6 border-l-4 border-l-[var(--accent)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-heading)]">
                Rekap Jumlah Porsi Dapur
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                {selectedDate
                  ? `Khusus Target Tanggal: ${formatDateIndo(selectedDate)}`
                  : 'Total seluruh pesanan aktif (tidak dibatalkan)'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] block">Total Omzet Filter</span>
            <span className="text-base sm:text-lg font-black text-[var(--accent)] font-[family-name:var(--font-heading)]">
              {formatRupiah(totalOmzetFiltered)}
            </span>
          </div>
        </div>

        {kitchenPortions.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">
            Tidak ada porsi yang perlu dimasak untuk filter ini.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kitchenPortions.map((kp) => (
              <div
                key={kp.name}
                className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between"
              >
                <span className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate mr-2">
                  {kp.name}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-white font-extrabold text-xs sm:text-sm font-[family-name:var(--font-heading)] shrink-0 shadow-sm">
                  {kp.qty} porsi
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="glass-card p-4 sm:p-5 flex flex-col md:flex-row items-center gap-3 print:hidden">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Cari nama, order #, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-xs outline-none focus:border-[var(--accent)]"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-56">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
          />
          <Calendar className="w-4 h-4 text-[var(--accent)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-xs font-medium outline-none focus:border-[var(--accent)] cursor-pointer appearance-none"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu Bayar</option>
            <option value="CONFIRMED">Dikonfirmasi</option>
            <option value="COOKING">Sedang Dimasak</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Reset Filter */}
        {(selectedDate || selectedStatus || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate('');
              setSelectedStatus('');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-[var(--accent)] hover:underline px-2 py-1"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ORDERS TABLE */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/70 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">No. Order</th>
                <th className="p-4">Pemesan</th>
                <th className="p-4">Untuk Tanggal</th>
                <th className="p-4">Menu & Porsi</th>
                <th className="p-4">Catatan</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    Memuat daftar pesanan...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    Tidak ada pesanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                    {/* Order Code */}
                    <td className="p-4 align-top">
                      <span className="font-mono font-bold text-[var(--accent)] block">
                        #{o.orderCode}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(o.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="p-4 align-top">
                      <div className="font-bold text-[var(--text-main)]">{o.customerName}</div>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{o.division}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{o.location}</span>
                      </div>
                    </td>

                    {/* Target Date */}
                    <td className="p-4 align-top">
                      <div className="font-semibold text-[var(--accent)] text-xs">
                        {formatDateIndo(o.targetDate)}
                      </div>
                    </td>

                    {/* Ordered Items */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)]">
                              {it.quantity}x
                            </span>
                            <span className="text-[var(--text-main)] font-medium">
                              {it.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="p-4 align-top max-w-xs">
                      {o.notes ? (
                        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-color)]">
                          {o.notes}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] opacity-50">-</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="p-4 align-top">
                      <div className="font-extrabold text-sm font-[family-name:var(--font-heading)] text-[var(--text-main)]">
                        {formatRupiah(o.totalAmount)}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        {o.paymentMethod}
                      </span>
                    </td>

                    {/* Status Select */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        {getStatusBadge(o.status)}
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="mt-1 text-xs py-1 px-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer print:hidden"
                        >
                          <option value="PENDING">Ubah: Menunggu</option>
                          <option value="CONFIRMED">Ubah: Konfirmasi</option>
                          <option value="COOKING">Ubah: Dimasak</option>
                          <option value="COMPLETED">Ubah: Selesai</option>
                          <option value="CANCELLED">Ubah: Batal</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Memuat pesanan...</p>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
