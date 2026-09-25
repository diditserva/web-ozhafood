'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  ShoppingBag,
  Calendar,
  Building2,
  MapPin,
  User,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Star,
  ShieldCheck,
  Truck,
  FileText,
  Search,
  QrCode,
  Copy,
  Maximize2,
  Download,
  X,
  CreditCard,
  Phone,
  Navigation,
  Loader2,
  Compass,
  ExternalLink,
} from 'lucide-react';
import {
  Product,
  formatRupiah,
  formatDateIndo,
  QRIS_IMAGE_DATA,
  BANK_ACCOUNTS,
  DEFAULT_DIVISIONS,
  DEFAULT_LOCATIONS,
  ADMIN_WA_NUMBER,
  FOOD_EMOJIS,
} from '@/lib/constants';
import ThemeToggle from '@/components/ThemeToggle';
import FoodImage from '@/components/FoodImage';

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍱';
}

function getNextFriday(weeksAhead: number = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 + weeksAhead * 7;
  d.setDate(d.getDate() + (diff === 0 && weeksAhead === 0 ? 0 : diff));
  return d.toISOString().split('T')[0];
}

export default function CustomerOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [divisions, setDivisions] = useState<string[]>(DEFAULT_DIVISIONS);
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [orderType, setOrderType] = useState<'VOZA' | 'DELIVERY' | 'PICKUP'>('VOZA');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [targetDate, setTargetDate] = useState(getNextFriday(0));
  const [notes, setNotes] = useState('');

  // Geolocation state for delivery
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);

  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Browser Anda tidak mendukung deteksi lokasi otomatis.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'id',
              },
            }
          );
          const data = await res.json();
          if (data && data.display_name) {
            setGeoAddress(data.display_name);
            setDeliveryAddress((prev) => (prev.trim() ? prev : data.display_name));
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Akses lokasi ditolak. Silakan aktifkan izin lokasi di browser atau ketik alamat manual.');
        } else if (err.code === 3) {
          setGeoError('Waktu deteksi lokasi habis. Silakan coba lagi atau ketik alamat manual.');
        } else {
          setGeoError('Tidak dapat membaca titik GPS. Silakan ketik alamat manual.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Quantities per product
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState<'qris' | 'bank'>('qris');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [showQrZoom, setShowQrZoom] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string>(QRIS_IMAGE_DATA);

  useEffect(() => {
    async function initData() {
      try {
        const [resProd, resDiv, resLoc, resInit] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/divisions'),
          fetch('/api/admin/locations'),
          fetch('/api/init'),
        ]);

        const jsonProd = await resProd.json();
        const jsonDiv = await resDiv.json();
        const jsonLoc = await resLoc.json();
        const jsonInit = await resInit.json().catch(() => null);

        if (jsonProd.success && jsonProd.data) {
          setProducts(jsonProd.data);
        }
        if (jsonDiv.success && jsonDiv.data && jsonDiv.data.length > 0) {
          setDivisions(jsonDiv.data.map((d: any) => d.name));
        }
        if (jsonLoc.success && jsonLoc.data && jsonLoc.data.length > 0) {
          setLocations(jsonLoc.data.map((l: any) => l.name));
        }
        if (jsonInit?.success && jsonInit.data?.qrisUrl) {
          setQrisUrl(jsonInit.data.qrisUrl);
        }
      } catch (err) {
        console.error('Failed loading data from API', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category || 'Makanan')));
    return ['Semua', ...cats];
  }, [products]);

  const handleUpdateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(quantities)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product || qty <= 0) return null;
        return {
          productId,
          productName: product.name,
          unitPrice: product.price,
          quantity: qty,
          subtotal: product.price * qty,
        };
      })
      .filter(Boolean) as {
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }[];
  }, [quantities, products]);

  const totalItemsCount = useMemo(() => {
    return Object.values(quantities).reduce((acc, curr) => acc + curr, 0);
  }, [quantities]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [cartItems]);

  const isFormValid = useMemo(() => {
    if (!customerName.trim() || !targetDate || cartItems.length === 0) return false;

    if (orderType === 'VOZA') {
      return selectedDivision.length > 0 && selectedLocation.length > 0;
    }

    if (orderType === 'DELIVERY') {
      return customerPhone.trim().length >= 8 && deliveryAddress.trim().length > 0;
    }

    if (orderType === 'PICKUP') {
      return customerPhone.trim().length >= 8;
    }

    return false;
  }, [
    customerName,
    targetDate,
    cartItems,
    orderType,
    selectedDivision,
    selectedLocation,
    customerPhone,
    deliveryAddress,
  ]);

  const handlePreSubmit = () => {
    if (!isFormValid) {
      let missingMsg = 'Mohon lengkapi formulir & pilih minimal 1 menu!';
      if (orderType === 'VOZA') {
        if (!selectedDivision || !selectedLocation) {
          missingMsg = 'Mohon pilih Divisi dan Lokasi Antar di Kantor Voza!';
        }
      } else if (orderType === 'DELIVERY') {
        if (!customerPhone.trim()) {
          missingMsg = 'Mohon isi Nomor WhatsApp aktif untuk konfirmasi pengantaran!';
        } else if (!deliveryAddress.trim()) {
          missingMsg = 'Mohon isi Alamat Pengiriman lengkap atau deteksi lokasi GPS!';
        }
      } else if (orderType === 'PICKUP') {
        if (!customerPhone.trim()) {
          missingMsg = 'Mohon isi Nomor WhatsApp aktif untuk konfirmasi pengambilan!';
        }
      }
      setToastMessage({ text: missingMsg, type: 'error' });
      return;
    }

    if (!notes.trim()) {
      setShowConfirmModal(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    let finalDivision = selectedDivision;
    let finalLocation = selectedLocation;
    let notesPrefix = '';

    if (orderType === 'VOZA') {
      finalDivision = selectedDivision || 'Kantor Voza';
      finalLocation = `🏢 Voza - ${selectedLocation}`;
      if (customerPhone.trim()) {
        notesPrefix = `[WA: ${customerPhone.trim()}]`;
      }
    } else if (orderType === 'DELIVERY') {
      finalDivision = 'Luar Voza (Delivery)';
      finalLocation = `🛵 Delivery: ${deliveryAddress.trim()}`;
      const mapUrl = geoCoords ? `https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}` : '';
      notesPrefix = `[WA: ${customerPhone.trim()}]${mapUrl ? ` [Peta: ${mapUrl}]` : ''}`;
    } else if (orderType === 'PICKUP') {
      finalDivision = 'Ambil Sendiri (Pick-up)';
      finalLocation = '🛍️ Ambil Sendiri di Dapur Ozha';
      notesPrefix = `[WA: ${customerPhone.trim()}]`;
    }

    const finalNotes = [notesPrefix, notes.trim()].filter(Boolean).join(' ');

    const payload = {
      customerName: customerName.trim(),
      division: finalDivision,
      location: finalLocation,
      targetDate,
      notes: finalNotes || undefined,
      paymentMethod: 'QRIS',
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productName: ci.productName,
        unitPrice: ci.unitPrice,
        quantity: ci.quantity,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        setLastSubmittedOrder(json.data);
        setShowSuccessModal(true);
        setToastMessage({ text: 'Pesanan PO berhasil dibuat!', type: 'success' });

        setQuantities({});
        setNotes('');
        setDeliveryAddress('');
        setGeoCoords(null);
        setGeoAddress('');
        setGeoError(null);
      } else {
        setToastMessage({
          text: json.error || 'Gagal mengirim pesanan. Silakan coba lagi.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ text: 'Terjadi kesalahan koneksi ke server.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(text);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const getWhatsAppLink = (order: any) => {
    if (!order) return '#';
    const phoneMatch = order.notes?.match(/\[WA:\s*([^\]]+)\]/);
    const mapsMatch = order.notes?.match(/\[Peta:\s*([^\]]+)\]/);

    const phoneLine = phoneMatch ? `\n📱 *No. HP/WA Pemesan*: ${phoneMatch[1]}` : '';
    const mapsLine = mapsMatch ? `\n🗺️ *Titik GPS Pengiriman*: ${mapsMatch[1]}` : '';

    const message = `Halo Admin Ozha Food! Saya ingin konfirmasi pembayaran untuk pesanan:
  
📌 *No. Order*: #${order.orderCode}
👤 *Nama*: ${order.customerName}${phoneLine}
🏢 *Tipe/Divisi*: ${order.division}
📍 *Tujuan/Lokasi*: ${order.location}${mapsLine}
📅 *Tanggal Kirim*: ${formatDateIndo(order.targetDate)}
💰 *Total Pembayaran*: ${formatRupiah(order.totalAmount)}

Berikut bukti pembayarannya. Terima kasih!`;

    const targetNumber = ADMIN_WA_NUMBER || '6285648020406';
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'Semua' || (p.category || 'Makanan') === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300 pb-28 md:pb-16 relative">
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-lg border transition-all animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-[var(--bg-secondary)] text-[var(--text-main)] border-[var(--border-glow)]'
              : 'bg-red-950/90 text-red-100 border-red-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[var(--accent-light)] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[var(--accent-light)] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        {/* Floating Navbar */}
        <header className="sticky top-4 z-30 mb-8 px-4 sm:px-6 py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass)] backdrop-blur-xl shadow-lg flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-md shadow-[var(--accent)]/25 text-white">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight gradient-title font-[family-name:var(--font-heading)]">
                  OZHA FOOD
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping inline-block" />
                  PO Buka
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                Pemesanan Pre-Order • Fresh & Halal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowQrZoom(true)}
              className="h-9 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 hover:bg-[var(--accent-light)] hover:border-[var(--border-glow)] text-xs font-bold flex items-center gap-1.5 transition-all btn-press text-[var(--text-main)]"
              title="Lihat Barcode QRIS Pembayaran"
            >
              <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline">QRIS Toko</span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Banner Section with Embedded QRIS Showcase */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-[var(--accent-light)] via-transparent to-transparent p-6 sm:p-10 mb-10 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[var(--accent-light)] rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-light)] border border-[var(--border-glow)] text-[var(--accent)] text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dibuat Segar Sesuai Pesanan Anda</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)] font-[family-name:var(--font-heading)] leading-tight mb-3">
                Cita Rasa Otentik, <span className="gradient-title">Dibuat Spesial</span> untuk Harimu.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                Pilih menu homemade favoritmu, tentukan tanggal antar yang kamu inginkan, dan biarkan dapur kami memasak hidangan hangat dan higienis untukmu.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--text-main)]">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] shadow-sm btn-press cursor-default hover:border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>100% Halal & Higienis</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] shadow-sm btn-press cursor-default hover:border-sky-500/40">
                  <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Antar ke Divisi Kantor Gratis</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] shadow-sm btn-press cursor-default hover:border-amber-500/40">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Resep Khas Homemade</span>
                </div>
              </div>
            </div>

            {/* Prominent QRIS Showcase in Hero */}
            <div className="shrink-0 w-full sm:w-auto self-center lg:self-auto">
              <div className="glass-card card-interactive p-4 sm:p-5 rounded-2xl flex flex-col items-center gap-3 border border-[var(--border-color)] shadow-lg bg-[var(--bg-glass)]/90 text-center">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-main)]">
                  <QrCode className="w-4 h-4 text-[var(--accent)]" />
                  <span>Scan & Bayar QRIS</span>
                </div>

                <div
                  onClick={() => setShowQrZoom(true)}
                  className="w-36 h-36 sm:w-40 sm:h-40 bg-white p-2.5 rounded-2xl shadow-sm border border-stone-200 relative group cursor-pointer overflow-hidden flex items-center justify-center"
                  title="Klik untuk perbesar barcode QRIS"
                >
                  <img
                    src={qrisUrl}
                    alt="Barcode QRIS Toko"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>Perbesar</span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-[var(--text-muted)] max-w-[160px] leading-tight">
                  BCA • GoPay • OVO • DANA • ShopeePay • Semua Bank
                </span>

                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setShowQrZoom(true)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] text-[11px] font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all btn-press text-[var(--text-main)]"
                  >
                    Perbesar
                  </button>
                  <a
                    href={qrisUrl}
                    download="QRIS_OzhaFood"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all btn-press text-[var(--text-main)] inline-flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Step Process Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 shadow-sm card-interactive hover:border-emerald-500/40 cursor-default group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-xs flex items-center justify-center group-hover:scale-110 transition-transform">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Pilih Menu Lezat</div>
              <div className="text-[11px] text-[var(--text-muted)]">Atur porsi hidangan kesukaanmu</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 shadow-sm card-interactive hover:border-amber-500/40 cursor-default group">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-xs flex items-center justify-center group-hover:scale-110 transition-transform">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Tentukan Jadwal & Lokasi</div>
              <div className="text-[11px] text-[var(--text-muted)]">Pilih hari pengantaran pesanan</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQrZoom(true)}
            className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 shadow-sm card-interactive hover:border-sky-500/40 text-left btn-press group w-full cursor-pointer"
            title="Klik untuk melihat barcode QRIS pembayaran"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-black text-xs flex items-center justify-center group-hover:scale-110 transition-transform">
              3
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-[var(--text-main)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>Konfirmasi & Bayar</span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-0.5">
                  <QrCode className="w-3 h-3" />
                  <span>Buka QRIS</span>
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Scan QRIS toko atau transfer bank instan</div>
            </div>
          </button>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Step 1: Customer Form */}
            <section className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                    Informasi Pemesan
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Isi nama dan pilih jadwal pengantaran pesananmu
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Nama Lengkap <span className="text-[var(--accent)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all"
                    />
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Tipe Pengantaran / Lokasi Switcher */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Tipe Pengantaran / Lokasi <span className="text-[var(--accent)]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('VOZA')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center btn-press group cursor-pointer ${
                        orderType === 'VOZA'
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent)]/20 scale-[1.02]'
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Building2 className={`w-5 h-5 shrink-0 group-hover:scale-115 transition-transform duration-200 ${orderType !== 'VOZA' ? 'text-sky-500' : ''}`} />
                      <span>Kantor Voza</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('DELIVERY');
                        if (!geoCoords && !geoLoading) {
                          detectLocation();
                        }
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center btn-press group cursor-pointer ${
                        orderType === 'DELIVERY'
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent)]/20 scale-[1.02]'
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Navigation className={`w-5 h-5 shrink-0 group-hover:scale-115 transition-transform duration-200 ${orderType !== 'DELIVERY' ? 'text-amber-500' : ''}`} />
                      <span>Delivery (Luar Voza)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('PICKUP')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center btn-press group cursor-pointer ${
                        orderType === 'PICKUP'
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent)]/20 scale-[1.02]'
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text-main)]'
                      }`}
                    >
                      <ShoppingBag className={`w-5 h-5 shrink-0 group-hover:scale-115 transition-transform duration-200 ${orderType !== 'PICKUP' ? 'text-emerald-500' : ''}`} />
                      <span>Ambil Sendiri</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on orderType */}
                {orderType === 'VOZA' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Divisi <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDivision}
                          onChange={(e) => setSelectedDivision(e.target.value)}
                          className="w-full pl-11 pr-8 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
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
                        Lokasi Antar <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          className="w-full pl-11 pr-8 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
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
                )}

                {orderType === 'DELIVERY' && (
                  <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Nomor WhatsApp Pemesan <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Contoh: 081234567890 (untuk konfirmasi kurir)"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all"
                        />
                        <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Geolocation GPS Detector */}
                    <div className="rounded-xl border border-dashed border-[var(--border-color)] p-3.5 bg-[var(--bg-primary)]/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                            <Compass className="w-4 h-4 text-[var(--accent)]" />
                            <span>Titik Lokasi GPS Pengantaran</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            Bantu kurir menemukan alamat Anda secara tepat dengan akurasi GPS
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={geoLoading}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--accent-light)] hover:bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--border-glow)] text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
                        >
                          {geoLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mencari Sinyal GPS...</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3.5 h-3.5" />
                              <span>{geoCoords ? 'Perbarui Titik GPS' : 'Deteksi Lokasi Saya'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {geoCoords && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            GPS Terkunci: {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] font-bold hover:underline"
                          >
                            <span>Buka di Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {geoError && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{geoError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Alamat Pengiriman Lengkap & Patokan <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Nama jalan, no. rumah/gedung, RT/RW, dan patokan (misal: seberang masjid, pagar hitam)..."
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all resize-none"
                        />
                        <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {orderType === 'PICKUP' && (
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Nomor WhatsApp Pemesan <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Contoh: 081234567890 (untuk konfirmasi pesanan siap)"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-medium transition-all"
                        />
                        <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--accent-light)] border border-[var(--border-glow)] text-xs text-[var(--text-muted)] flex items-start gap-2">
                      <ShoppingBag className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        Pesanan dapat diambil mandiri langsung di <strong>Dapur Ozha Food</strong> pada tanggal yang dipilih. Konfirmasi jam pengambilan akan kami kabari via WhatsApp.
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border-color)] mt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Pesanan untuk Kapan? <span className="text-[var(--accent)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={targetDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-sm font-semibold transition-all cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 text-[var(--accent)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={() => setTargetDate(getNextFriday(0))}
                      className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                        targetDate === getNextFriday(0)
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm shadow-[var(--accent)]/20'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      Jumat Minggu Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDate(getNextFriday(1))}
                      className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                        targetDate === getNextFriday(1)
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm shadow-[var(--accent)]/20'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      Jumat Minggu Depan
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Food Menu Section */}
            <section className="glass-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                      Daftar Menu Pilihan
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pilih hidangan dan atur jumlah porsinya
                    </p>
                  </div>
                </div>

                {/* Live Search Input */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari hidangan..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Category Filter Chips */}
              {categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap btn-press cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20 scale-[1.02]'
                          : 'bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-glow)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 animate-pulse flex flex-col gap-3"
                    >
                      <div className="h-32 rounded-2xl bg-[var(--border-color)]/30" />
                      <div className="h-5 w-3/4 rounded bg-[var(--border-color)]/40" />
                      <div className="h-3 w-full rounded bg-[var(--border-color)]/20" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-2xl">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Tidak ada menu yang sesuai dengan pencarian.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const qty = quantities[p.id] || 0;
                    const isAvailable = p.isActive;

                    return (
                      <div
                        key={p.id}
                        className={`group relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between card-interactive ${
                          !isAvailable
                            ? 'border-[var(--border-color)]/50 bg-[var(--bg-secondary)]/30 opacity-60'
                            : qty > 0
                            ? 'border-[var(--accent)] bg-[var(--bg-secondary)] shadow-xl shadow-[var(--accent)]/15 ring-2 ring-[var(--border-glow)]'
                            : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/80 hover:border-[var(--border-glow)] hover:shadow-lg'
                        }`}
                      >
                        <div>
                          <div className="relative h-32 sm:h-36 rounded-2xl bg-gradient-to-br from-[var(--accent-light)] via-transparent to-transparent border border-[var(--border-color)] flex items-center justify-center overflow-hidden mb-3.5">
                            <FoodImage
                              src={p.imageUrl}
                              alt={p.name}
                              fallbackEmoji={getFoodEmoji(p.name)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />

                            {/* Badge */}
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-extrabold text-[var(--accent)] flex items-center gap-1 shadow-sm group-hover:scale-105 transition-transform">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Favorit</span>
                            </div>

                            {!isAvailable && (
                              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm animate-pop">
                                Habis
                              </div>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                              {p.name}
                            </h3>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
                            {p.description || 'Menu lezat pilihan khas Ozha Food.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] border-dashed">
                          <span className="font-black text-[var(--accent)] text-base font-[family-name:var(--font-heading)] group-hover:scale-105 transition-transform origin-left">
                            {formatRupiah(p.price)}
                          </span>

                          {isAvailable ? (
                            <div className="flex items-center gap-2 bg-[var(--bg-primary)] p-1 rounded-2xl border border-[var(--border-color)] shadow-inner">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(p.id, -1)}
                                className="w-7 h-7 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-main)] flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm btn-press active:scale-80 disabled:opacity-30 disabled:hover:bg-[var(--bg-secondary)] disabled:hover:text-[var(--text-main)] cursor-pointer"
                                disabled={qty === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`font-black text-sm min-w-5 text-center transition-all ${
                                  qty > 0 ? 'text-[var(--accent)] scale-110 animate-pop' : 'text-[var(--text-muted)]'
                                }`}
                              >
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(p.id, 1)}
                                className="w-7 h-7 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] transition-all shadow-sm shadow-[var(--accent)]/30 btn-press active:scale-80 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
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

          {/* Sticky Right Panel: Bill / Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-6" id="cart-summary-section">
            <section className="glass-card p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
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
                  <div className="py-8 flex flex-col items-center justify-center text-center text-[var(--text-muted)] gap-2 border border-dashed border-[var(--border-color)] rounded-2xl">
                    <ShoppingBag className="w-8 h-8 opacity-30" />
                    <p className="text-xs font-medium leading-relaxed">
                      Keranjang masih kosong.<br />Pilih menu lezat di sebelah kiri!
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-sm py-2.5 border-b border-[var(--border-color)] border-dashed"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text-main)]">{item.productName}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] font-extrabold">
                          {item.quantity}x
                        </span>
                      </div>
                      <span className="font-black font-[family-name:var(--font-heading)]">
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
                    placeholder="Contoh: Pentol bumbu kacang banyak, siomay sambal dipisah, dll."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] outline-none text-xs font-medium transition-all resize-none"
                  />
                  <FileText className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col gap-2.5 mb-6">
                <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
                  <span>Subtotal ({totalItemsCount} porsi)</span>
                  <span className="font-bold text-[var(--text-main)]">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
                  <span>Ongkos Kirim Kantor</span>
                  <span className="font-black text-[var(--accent)]">GRATIS</span>
                </div>
                <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                  <div>
                    <span className="text-xs text-[var(--text-muted)] block">Total Pembayaran</span>
                    <span className="text-xl font-black text-[var(--accent)] font-[family-name:var(--font-heading)]">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)]">
                    PO Terverifikasi
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreSubmit}
                disabled={!isFormValid}
                className="w-full py-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:from-stone-600 disabled:to-stone-700 disabled:cursor-not-allowed text-white font-extrabold font-[family-name:var(--font-heading)] text-base shadow-xl shadow-[var(--accent)]/25 hover:shadow-2xl hover:shadow-[var(--accent)]/35 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98] btn-press shimmer-effect cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    <span>Pesan Sekarang</span>
                  </>
                )}
              </button>

              {/* QRIS Quick Preview in Sidebar */}
              <div className="pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowQrZoom(true)}
                  className="w-full p-3 rounded-2xl bg-[var(--bg-secondary)]/70 hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all flex items-center gap-3.5 text-left group cursor-pointer btn-press"
                  title="Klik untuk melihat dan scan barcode QRIS"
                >
                  <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-sm border border-stone-200 shrink-0 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={qrisUrl}
                      alt="QRIS Mini Preview"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                      <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Pembayaran via QRIS</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      BCA, GoPay, OVO, ShopeePay & Bank
                    </p>
                    <span className="text-[10px] font-extrabold text-[var(--accent)] flex items-center gap-1 mt-1">
                      Klik untuk perbesar barcode &rarr;
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      {totalAmount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-fade-slide-up">
          <button
            type="button"
            onClick={() => {
              document.getElementById('cart-summary-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full p-4 rounded-2xl bg-[var(--accent)] text-white font-bold flex items-center justify-between shadow-2xl shadow-[var(--accent)]/45 btn-press shimmer-effect transition-all active:scale-95"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs uppercase tracking-wider font-extrabold opacity-90">
                {totalItemsCount} ITEM TERPILIH
              </span>
              <span className="text-lg font-black font-[family-name:var(--font-heading)]">
                {formatRupiah(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-white/20 px-3.5 py-2 rounded-xl backdrop-blur-xs">
              <span>Checkout</span>
              <Send className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-sm w-full p-6 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
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
                className="py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-md shadow-[var(--accent)]/20"
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
            <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] border-2 border-[var(--border-glow)] text-[var(--accent)] flex items-center justify-center mb-4">
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
                <span className="text-[var(--accent)] font-mono">#{lastSubmittedOrder.orderCode}</span>
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
                <span className="font-semibold text-[var(--accent)]">
                  {formatDateIndo(lastSubmittedOrder.targetDate)}
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--border-color)] border-dashed flex justify-between font-bold text-sm">
                <span>Total Tagihan:</span>
                <span className="text-[var(--accent)] text-base font-[family-name:var(--font-heading)] font-extrabold">
                  {formatRupiah(lastSubmittedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="w-full mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                <CreditCard className="w-4 h-4 text-[var(--accent)]" />
                <span>Pilih Metode Pembayaran:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentTab('qris')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'qris'
                      ? 'bg-[var(--accent)] text-white shadow-sm'
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
                      ? 'bg-[var(--accent)] text-white shadow-sm'
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
                      src={qrisUrl}
                      alt="QRIS Ozha Food"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setShowQrZoom(true)}
                      className="flex-1 py-2 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[var(--accent)] transition-colors btn-press"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Perbesar</span>
                    </button>
                    <a
                      href={qrisUrl}
                      download="QRIS_OzhaFood"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[var(--accent)] transition-colors btn-press"
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
                        <div className="text-[11px] font-black text-[var(--accent)] uppercase tracking-wider">
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
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
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
              className="w-full py-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold font-[family-name:var(--font-heading)] text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 mb-3 transition-all"
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
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={qrisUrl} alt="QRIS Ozha Food" className="w-full h-auto max-h-[70vh] object-contain rounded-xl" />
            <p className="text-xs text-stone-600 font-bold text-center">
              Scan langsung dari kamera HP atau m-Banking Anda
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
