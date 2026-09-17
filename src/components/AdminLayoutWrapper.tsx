'use client';

import { usePathname } from 'next/navigation';
import AdminNavbar from './AdminNavbar';
import { AdminNotificationProvider } from '@/context/AdminNotificationContext';
import AdminNotificationToast from './AdminNotificationToast';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminNotificationProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col transition-colors duration-300 relative">
        <AdminNotificationToast />
        <AdminNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AdminNotificationProvider>
  );
}
