'use client';

import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Utensils,
  User,
  MapPin,
  Calendar,
  Building2,
  FileText,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Maximize2,
  X,
  Send,
  ExternalLink,
  CreditCard,
  QrCode,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ADMIN_WA_NUMBER,
  BANK_ACCOUNTS,
  QRIS_IMAGE_DATA,
  formatRupiah,
  formatDateIndo,
} from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: string;
}

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export default function CustomerOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQrZoom, setShowQrZoom] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'qris' | 'bank'>('qris');
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  const getNextFriday = (weeksAhead = 0): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0 && today.getHours() >= 15) {
      daysUntilFriday = 7;
    }
    const target = new Date();
    target.setDate(today.getDate() + daysUntilFriday + weeksAhead * 7);
    return target.toISOString().split('T')[0];
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/init');
        const json = await res.json();
        if (json.success) {
          setProducts(json.data.products);
          setDivisions(json.data.divisions);
          setLocations(json.data.locations);

          try {
            const savedName = localStorage.getItem('ozha_cust_name');
            const savedDiv = localStorage.getItem('ozha_cust_div');
            const savedLoc = localStorage.getItem('ozha_cust_loc');
            if (savedName) setCustomerName(savedName);
            if (savedDiv) setSelectedDivision(savedDiv);
            if (savedLoc) setSelectedLocation(savedLoc);
          } catch {
            // ignore
          }

          setTargetDate(getNextFriday(0));
        } else {
          showToast(json.error || 'Gagal memuat data menu', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server database', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateQty = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const curr = prev[productId] || 0;
      const next = Math.max(0, Math.min(99, curr + delta));
      return { ...prev, [productId]: next };
    });
  };

  const cartItems: CartItem[] = useMemo(() => {
    return products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        quantity: quantities[p.id],
        subtotal: quantities[p.id] * p.price,
      }));
  }, [products, quantities]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.subtotal, 0);
  }, [cartItems]);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.quantity, 0);
  }, [cartItems]);

  const isFormValid =
    customerName.trim().length > 0 &&
    selectedDivision !== '' &&
    selectedLocation !== '' &&
    targetDate !== '' &&
    totalAmount > 0 &&
    !isSubmitting;

  const handlePreSubmit = () => {
    if (!isFormValid) return;
    if (!notes.trim()) {
      setShowConfirmModal(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      try {
        localStorage.setItem('ozha_cust_name', customerName.trim());
        localStorage.setItem('ozha_cust_div', selectedDivision);
        localStorage.setItem('ozha_cust_loc', selectedLocation);
      } catch {
        // ignore
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          division: selectedDivision,
          location: selectedLocation,
          targetDate,
          notes: notes.trim(),
          paymentMethod: paymentTab === 'qris' ? 'QRIS' : 'TRANSFER_BANK',
          items: cartItems,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setLastSubmittedOrder(json.data);
        setShowSuccessModal(true);

        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#34d399', '#10b981', '#3b82f6'],
          });
        } catch {
          // ignore
        }

        setQuantities({});
        setNotes('');
        showToast('Pesanan berhasil disimpan ke sistem!', 'success');
      } else {
        showToast(json.error || 'Gagal menyimpan pesanan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi terputus saat menyimpan pesanan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = (number: string) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopiedBank(number);
      setTimeout(() => setCopiedBank(null), 2500);
      showToast('Nomor rekening berhasil disalin!', 'success');
    });
  };

  const getWhatsAppLink = (order: any) => {
    if (!order) return '#';

    let msg = `Halo Admin Ozha Food, saya konfirmasi pesanan:\n\n`;
    msg += `*No. Order:* #${order.orderCode}\n`;
    msg += `*Nama Pemesan:* ${order.customerName}\n`;
    msg += `*Divisi:* ${order.division}\n`;
    msg += `*Lokasi:* ${order.location}\n`;
    msg += `*Untuk Tanggal:* ${formatDateIndo(order.targetDate)}\n\n`;
    msg += `*Rincian Menu:*\n`;

    order.items?.forEach((it: any) => {
      msg += `- ${it.productName} (${it.quantity}x) = ${formatRupiah(it.subtotal)}\n`;
    });

    if (order.notes) {
      msg += `\n*Catatan Tambahan:* ${order.notes}\n`;
    }

    msg += `\n*Total Pembayaran:* ${formatRupiah(order.totalAmount)}\n`;
    msg += `*Metode Bayar:* ${order.paymentMethod === 'QRIS' ? 'QRIS' : 'Transfer Bank'}\n\n`;
    msg += `Bukti transfer/bayar terlampir. Terima kasih!`;

    return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const getFoodEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pentol')) return '🍢';
    if (lower.includes('siomay')) return '🥟';
    if (lower.includes('bakso') || lower.includes('tahu')) return '🧆';
    if (lower.includes('mie') || lower.includes('bihun')) return '🍜';
    if (lower.includes('es') || lower.includes('teh') || lower.includes('minum')) return '🥤';
    return '🍱';
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category || 'Lainnya')));
    return ['Semua', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        selectedCategory === 'Semua' ||
        (p.category || 'Lainnya').toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300 pb-28 md:pb-16 relative">
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-lg border transition-all animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30'
              : 'bg-red-950/90 text-red-100 border-red-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <header className="flex items-center justify-between py-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 text-white">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-clip-text text-transparent font-[family-name:var(--font-heading)]">
                OZHA FOOD
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
                Sistem Pemesanan Pre-Order • Lezat & Higienis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-xs font-bold text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500 transition-all backdrop-blur-md"
            >
              <span>Admin Dapur</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <section className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                    Informasi Pemesan
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Isi data diri & tanggal pesanan yang diinginkan
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Nama Lengkap <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-medium transition-all"
                    />
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Divisi <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className="w-full pl-11 pr-8 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Pilih Divisi Anda</option>
                        {divisions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <Building2 className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Lokasi Antar <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full pl-11 pr-8 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Pilih Lokasi Antar</option>
                        {locations.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)] mt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Pesanan untuk Kapan? <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={targetDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-semibold transition-all cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={() => setTargetDate(getNextFriday(0))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        targetDate === getNextFriday(0)
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-amber-500/50'
                      }`}
                    >
                      Jumat Minggu Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDate(getNextFriday(1))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        targetDate === getNextFriday(1)
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-amber-500/50'
                      }`}
                    >
                      Jumat Minggu Depan
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                      Daftar Menu Lezat
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pilih hidangan dan atur jumlah porsinya
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {products.length} Menu
                </span>
              </div>

              <div className="flex items-center gap-3 p-3.5 mb-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-xs text-[var(--text-main)]">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-amber-500">Sistem Pre-Order (PO):</span> Pesanan
                  dibuat segar sesuai tanggal yang Anda tentukan di formulir.
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 animate-pulse flex flex-col gap-3"
                    >
                      <div className="h-28 rounded-xl bg-[var(--border-color)]/30" />
                      <div className="h-5 w-3/4 rounded bg-[var(--border-color)]/40" />
                      <div className="h-3 w-full rounded bg-[var(--border-color)]/20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => {
                    const qty = quantities[p.id] || 0;
                    const isAvailable = p.isActive;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isAvailable
                            ? 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/5'
                            : 'border-[var(--border-color)]/50 bg-[var(--bg-secondary)]/30 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="relative h-28 sm:h-32 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-[var(--border-color)] flex items-center justify-center overflow-hidden mb-3.5">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl select-none">{getFoodEmoji(p.name)}</span>
                            )}

                            {!isAvailable && (
                              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-red-500 text-white text-[11px] font-extrabold shadow-sm">
                                Habis
                              </div>
                            )}
                          </div>

                          <h3 className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--text-main)] mb-1">
                            {p.name}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
                            {p.description || 'Menu lezat pilihan khas Ozha Food.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] border-dashed">
                          <span className="font-extrabold text-amber-500 text-base font-[family-name:var(--font-heading)]">
                            {formatRupiah(p.price)}
                          </span>

                          {isAvailable ? (
                            <div className="flex items-center gap-2.5 bg-[var(--bg-primary)] p-1 rounded-full border border-[var(--border-color)]">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(p.id, -1)}
                                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] text-[var(--text-main)] flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95"
                                disabled={qty === 0}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span
                                className={`font-bold text-sm min-w-5 text-center ${
                                  qty > 0 ? 'text-amber-500 font-extrabold scale-110' : 'text-[var(--text-muted)]'
                                }`}
                              >
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(p.id, 1)}
                                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] text-[var(--text-main)] flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-[var(--text-muted)] italic">
                              Tidak Tersedia
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6" id="cart-summary-section">
            <section className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                    Ringkasan Pesanan
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Periksa kembali daftar hidangan Anda
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 mb-5">
                {cartItems.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-[var(--text-muted)] gap-2 border border-dashed border-[var(--border-color)] rounded-xl">
                    <ShoppingBag className="w-8 h-8 opacity-30" />
                    <p className="text-xs font-medium">Belum ada menu yang dipilih.<br />Tambahkan menu kesukaanmu di kiri!</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-sm py-2.5 border-b border-[var(--border-color)] border-dashed"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text-main)]">{item.productName}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                          {item.quantity}x
                        </span>
                      </div>
                      <span className="font-bold font-[family-name:var(--font-heading)]">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Pentol sambal kacang banyak, siomay bumbu dipisah, dsb."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-xs font-medium transition-all resize-none"
                  />
                  <FileText className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col gap-2 mb-6">
                <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
                  <span>Subtotal Pesanan</span>
                  <span className="font-bold text-[var(--text-main)]">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
                  <span>Ongkos Kirim & Layanan</span>
                  <span className="font-bold text-emerald-500">Gratis (Internal)</span>
                </div>
                <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                  <span className="text-sm font-bold">Total Pembayaran</span>
                  <span className="text-xl font-extrabold text-amber-500 font-[family-name:var(--font-heading)]">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreSubmit}
                disabled={!isFormValid}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-stone-600 disabled:to-stone-700 disabled:cursor-not-allowed text-white font-bold font-[family-name:var(--font-heading)] text-base shadow-lg shadow-amber-500/25 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Pesan Sekarang</span>
                  </>
                )}
              </button>
            </section>
          </div>
        </main>
      </div>

      {totalAmount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            type="button"
            onClick={() => {
              document.getElementById('cart-summary-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full p-4 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-between shadow-xl shadow-amber-500/40 active:scale-95 transition-all"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs uppercase tracking-wider font-extrabold opacity-90">
                {totalItemsCount} ITEM TERPILIH
              </span>
              <span className="text-lg font-black font-[family-name:var(--font-heading)]">
                {formatRupiah(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-white/20 px-3.5 py-2 rounded-xl">
              <span>Checkout</span>
              <Send className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-sm w-full p-6 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-[family-name:var(--font-heading)] mb-1">
                Catatan Masih Kosong
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Apakah ada instruksi khusus (seperti bumbu dipisah atau tingkat kepedasan) sebelum pesanan dikirim?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold hover:bg-[var(--border-color)]/30 transition-all"
              >
                Isi Catatan
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                className="py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && lastSubmittedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 flex flex-col items-center my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-center mb-1">
              Pemesanan Berhasil!
            </h3>
            <p className="text-xs text-[var(--text-muted)] text-center mb-6">
              Pesanan #{lastSubmittedOrder.orderCode} telah tersimpan di sistem dapur.
            </p>

            <div className="w-full p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs mb-6 flex flex-col gap-2">
              <div className="flex justify-between pb-2 border-b border-[var(--border-color)] font-bold text-sm">
                <span>No. Order</span>
                <span className="text-amber-500 font-mono">#{lastSubmittedOrder.orderCode}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Nama Pemesan:</span>
                <span className="font-semibold text-[var(--text-main)]">{lastSubmittedOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Divisi & Lokasi:</span>
                <span className="font-semibold text-[var(--text-main)]">
                  {lastSubmittedOrder.division} • {lastSubmittedOrder.location}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Tanggal Kebutuhan:</span>
                <span className="font-semibold text-amber-500">
                  {formatDateIndo(lastSubmittedOrder.targetDate)}
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--border-color)] border-dashed flex justify-between font-bold text-sm">
                <span>Total Tagihan:</span>
                <span className="text-amber-500 text-base font-[family-name:var(--font-heading)] font-extrabold">
                  {formatRupiah(lastSubmittedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="w-full mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Pilih Metode Pembayaran:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentTab('qris')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'qris'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Bayar QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('bank')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'bank'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Transfer Bank</span>
                </button>
              </div>

              {paymentTab === 'qris' && (
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col items-center text-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    Scan via BCA Mobile, GoPay, OVO, ShopeePay, DANA, dll.
                  </span>

                  <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-md border border-stone-200 relative group flex items-center justify-center">
                    <img
                      src={QRIS_IMAGE_DATA}
                      alt="QRIS Ozha Food"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setShowQrZoom(true)}
                      className="flex-1 py-2 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-amber-500 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Perbesar</span>
                    </button>
                    <a
                      href={QRIS_IMAGE_DATA}
                      download="QRIS_OzhaFood.svg"
                      className="flex-1 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-amber-500 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh QR</span>
                    </a>
                  </div>
                </div>
              )}

              {paymentTab === 'bank' && (
                <div className="flex flex-col gap-2.5">
                  {BANK_ACCOUNTS.map((b) => (
                    <div
                      key={b.number}
                      className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[11px] font-black text-amber-500 uppercase tracking-wider">
                          {b.bank}
                        </div>
                        <div className="text-base font-mono font-bold tracking-wider text-[var(--text-main)]">
                          {b.number}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-medium">{b.holder}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(b.number)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          copiedBank === b.number
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedBank === b.number ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a
              href={getWhatsAppLink(lastSubmittedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-[family-name:var(--font-heading)] text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 mb-3 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Konfirmasi Pesanan ke WhatsApp Admin</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-primary)] transition-all"
            >
              Tutup & Buat Pesanan Baru
            </button>
          </div>
        </div>
      )}

      {showQrZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setShowQrZoom(false)}
        >
          <div
            className="relative bg-white p-6 rounded-3xl max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrZoom(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={QRIS_IMAGE_DATA} alt="QRIS Ozha Food" className="w-full h-auto" />
            <p className="text-xs text-stone-600 font-bold text-center">
              Scan langsung dari kamera HP atau m-Banking Anda
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

