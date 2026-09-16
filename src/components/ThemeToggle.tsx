'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('Ozha-theme') as 'dark' | 'light';
    const initialTheme = saved || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('Ozha-theme', nextTheme);
    } catch {
      // ignore in iframe/sandboxed env
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-main)] shadow-sm hover:border-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
      aria-label="Toggle Theme"
      type="button"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-amber-600" />
      )}
    </button>
  );
}
