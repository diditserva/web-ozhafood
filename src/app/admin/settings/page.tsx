'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  QrCode,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';
import { QRIS_IMAGE_DATA } from '@/lib/constants';

interface Item {
  id: string;
  name: string;
}

export default function AdminSettingsPage() {
  const [divisions, setDivisions] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Item[]>([]);
  const [newDivision, setNewDivision] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(true);

  // QRIS states
  const [qrisUrl, setQrisUrl] = useState(QRIS_IMAGE_DATA);
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingQris, setIsSavingQris] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showQrPreviewModal, setShowQrPreviewModal] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = async () => {
    try {
      const [resDiv, resLoc, resQris] = await Promise.all([
        fetch('/api/admin/divisions'),
        fetch('/api/admin/locations'),
        fetch('/api/admin/settings/qris'),
      ]);
      const jsonDiv = await resDiv.json();
      const jsonLoc = await resLoc.json();
      const jsonQris = await resQris.json();

      if (jsonDiv.success) setDivisions(jsonDiv.data);
      if (jsonLoc.success) setLocations(jsonLoc.data);
      if (jsonQris.success && jsonQris.data?.qrisUrl) {
        setQrisUrl(jsonQris.data.qrisUrl);
        setManualUrlInput(jsonQris.data.qrisUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Upload QR code image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file QR code maksimal 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'ozhafood/qris');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setQrisUrl(data.url);
        setManualUrlInput(data.url);
        setToast({ text: 'Gambar QRIS berhasil diunggah. Silakan klik "Simpan QRIS".', type: 'success' });
      } else {
        setUploadError(data.error || 'Gagal mengunggah foto QRIS');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || 'Gagal menghubungi server');
    } finally {
      setIsUploading(false);
    }
  };

  // Save QRIS setting
  const handleSaveQris = async (urlToSave?: string) => {
    const targetUrl = (urlToSave !== undefined ? urlToSave : useManualUrl ? manualUrlInput : qrisUrl).trim();
    if (!targetUrl) {
      setToast({ text: 'URL gambar QRIS tidak boleh kosong', type: 'error' });
      return;
    }

    setIsSavingQris(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/admin/settings/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrisUrl: targetUrl }),
      });
      const json = await res.json();

      if (json.success) {
        setQrisUrl(json.data.qrisUrl);
        setManualUrlInput(json.data.qrisUrl);
        setToast({ text: 'QRIS Pembayaran berhasil disimpan & aktif untuk pelanggan!', type: 'success' });
      } else {
        setToast({ text: json.error || 'Gagal menyimpan QRIS', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: 'Gagal menghubungi server', type: 'error' });
    } finally {
      setIsSavingQris(false);
    }
  };

  const handleResetDefaultQris = () => {
    handleSaveQris(QRIS_IMAGE_DATA);
  };

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivision.trim()) return;
    try {
      const res = await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDivision.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewDivision('');
        fetchData();
        setToast({ text: 'Divisi baru berhasil ditambahkan!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDivision = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/divisions?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDivisions((prev) => prev.filter((d) => d.id !== id));
        setToast({ text: 'Divisi berhasil dihapus', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocation.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewLocation('');
        fetchData();
        setToast({ text: 'Lokasi antar baru berhasil ditambahkan!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
        setToast({ text: 'Lokasi berhasil dihapus', type: 'success' });
      }
    } catch (err) {
      console.error(err);
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

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)]">
          Pengaturan Sistem & QRIS
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Kelola barcode QRIS pembayaran pelanggan, daftar divisi kerja, dan lokasi titik pengantaran.
        </p>
      </div>

      {/* SECTION 1: QRIS Payment Settings */}
      <div className="glass-card card-interactive p-6 sm:p-8 flex flex-col gap-6 border-l-4 border-l-[var(--accent)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Metode Pembayaran Pelanggan</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                <QrCode className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-heading)]">
                Pengaturan Barcode QRIS Toko
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
              Upload foto barcode QRIS (BCA, GoPay, OVO, ShopeePay, DANA, dsb). QR code ini akan langsung muncul di halaman pemesanan saat pelanggan memilih pembayaran QRIS.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaultQris}
            disabled={isSavingQris || qrisUrl === QRIS_IMAGE_DATA}
            className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)] flex items-center gap-1.5 self-start sm:self-center transition-all disabled:opacity-40 btn-press shrink-0"
            title="Kembalikan ke gambar QRIS bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke QR Bawaan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2 border-t border-[var(--border-color)]">
          {/* QR Preview (Left, 4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Preview QRIS Saat Ini
            </span>

            <div className="relative group w-48 h-48 bg-white p-3 rounded-2xl shadow-md border border-stone-200 flex items-center justify-center overflow-hidden">
              <img
                src={qrisUrl}
                alt="Barcode QRIS Toko"
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => setShowQrPreviewModal(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-bold backdrop-blur-xs"
              >
                <Maximize2 className="w-5 h-5" />
                <span>Perbesar QR</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              <span>QRIS Aktif di Web Order</span>
            </div>
          </div>

          {/* Upload Controls (Right, 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Unggah File QR Code Baru
              </label>
              <button
                type="button"
                onClick={() => setUseManualUrl(!useManualUrl)}
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                {useManualUrl ? <Upload className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{useManualUrl ? 'Gunakan Upload File' : 'Input Link URL Gambar Manual'}</span>
              </button>
            </div>

            {useManualUrl ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={manualUrlInput}
                  onChange={(e) => setManualUrlInput(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../qris.png"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)]"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  Masukkan link gambar langsung berformat JPG, PNG, WEBP, atau SVG.
                </p>
              </div>
            ) : (
              <div>
                <label
                  className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isUploading
                      ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                      : 'border-[var(--border-glow)] hover:border-[var(--accent)] bg-[var(--accent-light)]/40 hover:bg-[var(--accent-light)]'
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
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                      <span className="text-xs font-bold text-[var(--accent)]">
                        Mengunggah Barcode QRIS...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] border border-[var(--border-glow)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[var(--text-main)] block">
                          Klik untuk Memilih File QR Code
                        </span>
                        <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                          Mendukung file JPG, PNG, WEBP, atau SVG (Maksimal 5MB)
                        </span>
                      </div>
                    </div>
                  )}
                </label>

                {uploadError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveQris()}
                disabled={isSavingQris || isUploading}
                className="px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--accent)]/25 transition-all btn-press shimmer-effect disabled:opacity-50"
              >
                {isSavingQris ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan QRIS...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Terapkan & Simpan QRIS</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-[var(--text-muted)]">
                Perubahan langsung aktif seketika di halaman checkout pemesan.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Reference Lists (Divisi & Lokasi) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Divisi Card */}
        <div className="glass-card card-interactive p-6 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold font-[family-name:var(--font-heading)]">
                Daftar Divisi ({divisions.length})
              </h2>
            </div>

            <form onSubmit={handleAddDivision} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                placeholder="Tambah divisi baru..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1 transition-all btn-press shimmer-effect shadow-md shadow-[var(--accent)]/20 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-[var(--text-muted)]">Memuat...</p>
              ) : divisions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Belum ada divisi.</p>
              ) : (
                divisions.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs hover:border-[var(--accent)]/40 transition-all group"
                  >
                    <span className="font-semibold group-hover:text-[var(--accent)] transition-colors">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDivision(d.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-all btn-press"
                      title="Hapus Divisi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Lokasi Card */}
        <div className="glass-card card-interactive p-6 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold font-[family-name:var(--font-heading)]">
                Daftar Lokasi Antar ({locations.length})
              </h2>
            </div>

            <form onSubmit={handleAddLocation} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Tambah lokasi antar..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1 transition-all btn-press shimmer-effect shadow-md shadow-[var(--accent)]/20 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-[var(--text-muted)]">Memuat...</p>
              ) : locations.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Belum ada lokasi.</p>
              ) : (
                locations.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs hover:border-[var(--accent)]/40 transition-all group"
                  >
                    <span className="font-semibold group-hover:text-[var(--accent)] transition-colors">{l.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(l.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-all btn-press"
                      title="Hapus Lokasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Zoom Preview Modal */}
      {showQrPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowQrPreviewModal(false)}
        >
          <div
            className="relative bg-white p-6 rounded-3xl max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrPreviewModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold shadow-lg btn-press"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={qrisUrl} alt="Preview QRIS" className="w-full h-auto object-contain rounded-xl" />
            <p className="text-xs text-stone-600 font-bold text-center">
              Barcode QRIS ini yang akan dilihat oleh pelanggan Anda saat pembayaran.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
