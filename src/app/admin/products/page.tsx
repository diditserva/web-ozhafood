'use client';

import { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products
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

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setCategory(p.category || 'Makanan');
    setShowAddModal(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setCategory('Makanan');
    setShowAddModal(false);
  };

  // Save product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || isNaN(Number(price))) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        category,
      };

      if (editingProduct) {
        // Edit
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          fetchProducts();
          resetForm();
        }
      } else {
        // Create
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          fetchProducts();
          resetForm();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
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
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Memuat daftar produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center text-[var(--text-muted)]">
          Belum ada produk. Klik tombol diatas untuk menambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className={`glass-card p-5 flex flex-col justify-between transition-all ${
                !p.isActive ? 'opacity-75 bg-[var(--bg-secondary)]/40 border-stone-700' : ''
              }`}
            >
              <div>
                {/* Status Header Toggle */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Status Menu:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p.id, p.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                      p.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {p.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Tersedia (Aktif)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-red-400" />
                        <span>Habis (Nonaktif)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-[var(--border-color)] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>🍱</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--text-main)] font-[family-name:var(--font-heading)]">
                      {p.name}
                    </h3>
                    <div className="text-sm font-extrabold text-amber-500 font-[family-name:var(--font-heading)]">
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
                  className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-amber-500 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Nama Menu <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pentol Kriwil Pedas"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Harga (Rp) <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-amber-500"
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
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-medium outline-none focus:border-amber-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  URL Foto Menu (Opsional)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-amber-500"
                />
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
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all"
                >
                  {isSubmitting ? 'Menyimpan...' : editingProduct ? 'Update Menu' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
