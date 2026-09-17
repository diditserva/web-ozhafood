'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Utensils,
  Edit2,
  Trash2,
  X,
  Upload,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { Product, formatRupiah } from '@/lib/constants';
import FoodImage from '@/components/FoodImage';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [useManualUrl, setUseManualUrl] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('');
    setDescription('');
    setImageUrl('');
    setUseManualUrl(false);
    setEditingProduct(null);
    setShowAddModal(false);
    setFormError(null);
    setUploadError(null);
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setImageUrl(data.url);
      } else {
        setUploadError(data.error || 'Gagal mengunggah foto ke Cloudinary');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || 'Gagal menghubungi server');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();

      if (res.status === 401) {
        window.location.href = '/admin/login?redirect=/admin/products';
        return;
      }

      if (json.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
        );
        setToast({
          text: `Status menu diubah menjadi ${!currentStatus ? 'Aktif' : 'Habis'}`,
          type: 'success',
        });
      } else {
        setToast({ text: json.error || 'Gagal mengubah status menu', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: 'Gagal menghubungi server', type: 'error' });
    }
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category || '');
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setUseManualUrl(!p.imageUrl?.includes('cloudinary.com'));
    setShowAddModal(true);
  };

  // Save (Create / Update) Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setFormError('Nama menu dan harga wajib diisi');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Harga harus berupa angka positif');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: name.trim(),
      price: numPrice,
      category: category.trim() || 'Makanan',
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 401) {
        window.location.href = '/admin/login?redirect=/admin/products';
        return;
      }

      if (json.success) {
        if (editingProduct) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? json.data : p)));
          setToast({ text: 'Menu berhasil diperbarui!', type: 'success' });
        } else {
          setProducts((prev) => [json.data, ...prev]);
          setToast({ text: 'Menu baru berhasil ditambahkan!', type: 'success' });
        }
        resetForm();
      } else {
        setFormError(json.error || 'Gagal menyimpan menu');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Gagal menghubungi server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, productName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${productName}" dari menu?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (res.status === 401) {
        window.location.href = '/admin/login?redirect=/admin/products';
        return;
      }

      if (json.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setToast({ text: `Menu "${productName}" berhasil dihapus`, type: 'success' });
      } else {
        setToast({ text: json.error || 'Gagal menghapus produk', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: 'Gagal menghubungi server', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-[var(--accent)]/20'
                : 'bg-red-600 text-white border-red-500 shadow-red-600/20'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)]">
            Kelola Produk & Ketersediaan Stok
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Atur status menu (Aktif / Habis), ubah harga, atau tambahkan varian menu baru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--accent)]/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Memuat daftar produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-light)] border border-[var(--border-glow)] flex items-center justify-center text-[var(--accent)] mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-[family-name:var(--font-heading)]">
            Belum Ada Produk Terdaftar
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-6">
            Tambahkan menu pertama Anda agar pelanggan dapat mulai melakukan pemesanan PO.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[var(--accent)]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className={`glass-card p-5 flex flex-col justify-between transition-all duration-200 ${
                !p.isActive ? 'opacity-60 grayscale-50' : ''
              }`}
            >
              <div>
                {/* Status Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {p.category || 'Makanan'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(p.id, p.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      p.isActive
                        ? 'bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)]'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {p.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-[var(--accent)]" />
                        <span>Tersedia</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-red-500" />
                        <span>Habis</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-16 h-16 rounded-xl bg-[var(--accent-light)] border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                    <FoodImage src={p.imageUrl} alt={p.name} fallbackEmoji="🍱" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--text-main)] font-[family-name:var(--font-heading)]">
                      {p.name}
                    </h3>
                    <div className="text-sm font-extrabold text-[var(--accent)] font-[family-name:var(--font-heading)]">
                      {formatRupiah(p.price)}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      {p.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)] mt-2">
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[var(--accent)] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(p.id, p.name)}
                  className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Hapus Produk"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={resetForm}
              className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] mb-4">
              {editingProduct ? 'Edit Menu' : 'Tambah Menu Baru'}
            </h3>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">{formError}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Nama Menu <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Pentol Kriwil Pedas"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Harga (Rp) <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="15000"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Pentol / Siomay"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Deskripsi singkat hidangan..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              {/* Foto Menu Upload (Cloudinary) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Foto Menu (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseManualUrl(!useManualUrl)}
                    className="text-[10px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    {useManualUrl ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                    <span>{useManualUrl ? 'Gunakan Upload Cloudinary' : 'Gunakan URL Manual'}</span>
                  </button>
                </div>

                {useManualUrl ? (
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)]"
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {imageUrl ? (
                      <div className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg border border-[var(--border-color)] overflow-hidden shrink-0">
                          <FoodImage src={imageUrl} alt="Preview" fallbackEmoji="🍱" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-[var(--text-main)]">
                            Foto Berhasil Dimuat
                          </p>
                          <p className="text-[10px] text-[var(--accent)] font-semibold truncate">
                            {imageUrl.includes('cloudinary.com') ? '✓ Tersimpan di Cloudinary' : '✓ Link Foto Aktif'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Hapus / Ganti Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isUploading
                            ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                            : 'border-[var(--border-glow)] hover:border-[var(--accent)] bg-[var(--accent-light)]/50 hover:bg-[var(--accent-light)]'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
                            <span className="text-xs font-bold text-[var(--accent)]">
                              Mengunggah ke Cloudinary...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-main)]">
                              Klik untuk Unggah Gambar Menu
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              JPG, PNG, WEBP (Maksimal 5MB)
                            </span>
                          </div>
                        )}
                      </label>
                    )}

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--border-color)] mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-xs font-bold hover:bg-[var(--bg-primary)] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-[var(--accent)]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Menu' : 'Simpan Menu'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
