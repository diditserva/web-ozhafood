'use client';

import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorPreset = 'emerald' | 'amber' | 'crimson' | 'violet' | 'teal';

interface PresetOption {
  id: ColorPreset;
  label: string;
  color: string;
  gradient: string;
}

const COLOR_PRESETS: PresetOption[] = [
  { id: 'emerald', label: 'Emerald Fresh', color: '#15803d', gradient: 'from-emerald-500 to-green-600' },
  { id: 'amber', label: 'Sunset Amber', color: '#ea580c', gradient: 'from-amber-500 to-orange-600' },
  { id: 'crimson', label: 'Crimson Red', color: '#dc2626', gradient: 'from-red-500 to-rose-600' },
  { id: 'violet', label: 'Royal Violet', color: '#7c3aed', gradient: 'from-violet-500 to-purple-600' },
  { id: 'teal', label: 'Ocean Teal', color: '#0d9488', gradient: 'from-teal-500 to-cyan-600' },
];

export default function ThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [colorPreset, setColorPreset] = useState<ColorPreset>('emerald');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply theme mode & color preset to document root
  const applyTheme = (mode: ThemeMode, preset: ColorPreset) => {
    let resolved: 'light' | 'dark';
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }

    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-color-preset', preset);
  };

  useEffect(() => {
    // Read saved theme mode & color preset from localStorage
    const savedMode = localStorage.getItem('Ozha-theme') as ThemeMode | null;
    const initialMode: ThemeMode =
      savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';

    const savedPreset = localStorage.getItem('Ozha-color-preset') as ColorPreset | null;
    const validPresets: ColorPreset[] = ['emerald', 'amber', 'crimson', 'violet', 'teal'];
    const initialPreset: ColorPreset = savedPreset && validPresets.includes(savedPreset) ? savedPreset : 'emerald';

    setThemeMode(initialMode);
    setColorPreset(initialPreset);
    applyTheme(initialMode, initialPreset);

    // Media query listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentSavedMode = localStorage.getItem('Ozha-theme') as ThemeMode | null;
      if (!currentSavedMode || currentSavedMode === 'system') {
        const nextResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        document.documentElement.setAttribute('data-theme', nextResolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    // Click outside listener for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode, colorPreset);
    try {
      localStorage.setItem('Ozha-theme', mode);
    } catch {
      // ignore in sandboxed environments
    }
  };

  const selectColorPreset = (preset: ColorPreset) => {
    setColorPreset(preset);
    applyTheme(themeMode, preset);
    try {
      localStorage.setItem('Ozha-color-preset', preset);
    } catch {
      // ignore
    }
  };

  const modeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Terang', icon: Sun },
    { mode: 'dark', label: 'Gelap', icon: Moon },
    { mode: 'system', label: 'Sistem', icon: Monitor },
  ];

  const activePresetConfig = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0];

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-9 px-2.5 flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-main)] shadow-xs hover:border-[var(--accent)] active:scale-95 transition-all duration-200 outline-none focus:outline-none shrink-0"
        aria-label="Pengaturan Tema & Warna"
        title={`Tema: ${themeMode === 'system' ? `Sistem (${resolvedTheme})` : themeMode} | Warna: ${activePresetConfig.label}`}
        type="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5">
          {themeMode === 'system' ? (
            <Monitor className="w-4 h-4 text-[var(--accent)]" />
          ) : themeMode === 'dark' ? (
            <Moon className="w-4 h-4 text-amber-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-600" />
          )}

          {/* Color Indicator Badge */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs inline-block"
            style={{ backgroundColor: activePresetConfig.color }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 py-2 px-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-main)]">
          {/* Section 1: Mode Tampilan */}
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)] mb-1.5 flex items-center justify-between">
            <span>Mode Tampilan</span>
            <span className="capitalize text-[10px] font-semibold text-[var(--accent)]">
              {themeMode === 'system' ? `Sistem (${resolvedTheme})` : themeMode}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 px-1 mb-3">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => selectThemeMode(opt.mode)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'text-white bg-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-light)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 2: Warna Aksentuasi */}
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-t border-b border-[var(--border-color)] my-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-[var(--accent)]" />
              <span>Tema Warna</span>
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent)]">{activePresetConfig.label}</span>
          </div>

          <div className="space-y-0.5 px-1">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = colorPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectColorPreset(preset.id)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border-glow)]'
                      : 'text-[var(--text-main)] hover:bg-[var(--accent-light)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-white/30 shadow-xs shrink-0 transition-transform"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
