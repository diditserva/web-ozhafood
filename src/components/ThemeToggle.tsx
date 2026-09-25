'use client';

import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply theme mode to document root
  const applyTheme = (mode: ThemeMode) => {
    let resolved: 'light' | 'dark';
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }

    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.removeAttribute('data-color-preset');
  };

  useEffect(() => {
    // Clean up any legacy color preset
    try {
      localStorage.removeItem('Ozha-color-preset');
    } catch {
      // ignore
    }

    // Read saved theme mode from localStorage
    const savedMode = localStorage.getItem('Ozha-theme') as ThemeMode | null;
    const initialMode: ThemeMode =
      savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';

    setThemeMode(initialMode);
    applyTheme(initialMode);

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
    applyTheme(mode);
    setIsOpen(false);
    try {
      localStorage.setItem('Ozha-theme', mode);
    } catch {
      // ignore
    }
  };

  const modeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Terang', icon: Sun },
    { mode: 'dark', label: 'Gelap', icon: Moon },
    { mode: 'system', label: 'Sistem', icon: Monitor },
  ];

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-main)] shadow-xs hover:border-[var(--accent)] active:scale-95 transition-all duration-200 outline-none focus:outline-none shrink-0"
        aria-label="Pengaturan Mode Tampilan"
        title={`Mode: ${themeMode === 'system' ? `Sistem (${resolvedTheme})` : themeMode === 'dark' ? 'Gelap' : 'Terang'}`}
        type="button"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
        )}
        <span className="text-xs font-semibold hidden sm:inline capitalize text-[var(--text-muted)]">
          {themeMode === 'system' ? 'Sistem' : themeMode === 'dark' ? 'Gelap' : 'Terang'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 py-1.5 px-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-main)]">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Mode Tampilan
          </div>
          <div className="space-y-0.5">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => selectThemeMode(opt.mode)}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
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
