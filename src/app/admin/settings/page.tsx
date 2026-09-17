'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Plus, Trash2 } from 'lucide-react';

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

  const fetchData = async () => {
    try {
      const [resDiv, resLoc] = await Promise.all([
        fetch('/api/admin/divisions'),
        fetch('/api/admin/locations'),
      ]);
      const jsonDiv = await resDiv.json();
      const jsonLoc = await resLoc.json();
      if (jsonDiv.success) setDivisions(jsonDiv.data);
      if (jsonLoc.success) setLocations(jsonLoc.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)]">
          Pengaturan Referensi
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Kelola daftar Divisi kerja dan Lokasi pengantaran yang muncul di dropdown formulir pemesan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Divisi Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Building2 className="w-5 h-5 text-[var(--accent)]" />
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
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1 transition-all"
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
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDivision(d.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
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
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <MapPin className="w-5 h-5 text-[var(--accent)]" />
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
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1 transition-all"
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
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold">{l.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(l.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
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
    </div>
  );
}
