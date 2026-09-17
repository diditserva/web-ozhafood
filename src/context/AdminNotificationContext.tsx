'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playOrderNotificationSound } from '@/lib/notification-sound';

export interface NotificationOrder {
  id: string;
  orderCode: string;
  customerName: string;
  division: string;
  location: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
  }[];
}

interface AdminNotificationContextType {
  orders: NotificationOrder[];
  pendingCount: number;
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  permissionStatus: NotificationPermission;
  requestDesktopPermission: () => Promise<void>;
  activeToast: NotificationOrder | null;
  dismissToast: () => void;
  markAllAsRead: () => void;
  playTestSound: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

const LAST_SEEN_KEY = 'ozha_admin_last_seen_order_id';
const SOUND_SETTING_KEY = 'ozha_admin_sound_enabled';

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [orders, setOrders] = useState<NotificationOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem(SOUND_SETTING_KEY);
      return savedSound !== null ? savedSound === 'true' : true;
    }
    return true;
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [activeToast, setActiveToast] = useState<NotificationOrder | null>(null);

  const initialLoadDone = useRef(false);
  const lastKnownOrderId = useRef<string | null>(null);

  // Initialize last seen from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (savedLastSeen) {
        lastKnownOrderId.current = savedLastSeen;
      }
    }
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_SETTING_KEY, String(enabled));
    }
  };

  const playTestSound = () => {
    playOrderNotificationSound();
  };

  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm === 'granted') {
        new Notification('Ozha Food Admin', {
          body: 'Notifikasi desktop aktif! Anda akan mendapat pemberitahuan saat ada pesanan baru.',
          icon: '/favicon.ico',
        });
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  const notifyNewOrder = useCallback((order: NotificationOrder) => {
    // 1. Play chime if sound enabled
    if (soundEnabled) {
      playOrderNotificationSound();
    }

    // 2. Desktop Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `🔔 Pesanan Baru Masuk (#${order.orderCode})`;
        const body = `${order.customerName} (${order.division} - ${order.location})\nTotal: Rp ${order.totalAmount.toLocaleString('id-ID')}`;
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: order.id,
        });
        notification.onclick = () => {
          window.focus();
          router.push('/admin/orders');
        };
      } catch (err) {
        console.warn('Error displaying desktop notification:', err);
      }
    }

    // 3. Show In-App Floating Toast
    setActiveToast(order);

    // 4. Dispatch browser event for active pages (e.g. /admin/orders)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ozha:new-order', { detail: order }));
    }
  }, [soundEnabled, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success || !json.data) return;

      const { pendingCount: pCount, latestOrderId, orders: newOrders } = json.data;
      setOrders(newOrders || []);
      setPendingCount(pCount || 0);

      // On initial load, set known ID without triggering alerts
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        if (latestOrderId) {
          lastKnownOrderId.current = latestOrderId;
          const savedLastSeen = localStorage.getItem(LAST_SEEN_KEY);
          if (!savedLastSeen) {
            localStorage.setItem(LAST_SEEN_KEY, latestOrderId);
          } else {
            // Count how many orders are newer than savedLastSeen
            const idx = (newOrders as NotificationOrder[]).findIndex((o) => o.id === savedLastSeen);
            if (idx > 0) {
              setUnreadCount(idx);
            } else if (idx === -1 && newOrders.length > 0) {
              setUnreadCount(newOrders.length);
            }
          }
        }
        return;
      }

      // If a new order is detected
      if (latestOrderId && latestOrderId !== lastKnownOrderId.current) {
        lastKnownOrderId.current = latestOrderId;

        const newestOrder = (newOrders as NotificationOrder[])[0];
        if (newestOrder) {
          notifyNewOrder(newestOrder);
        }

        // Update unread count
        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        if (lastSeen) {
          const idx = (newOrders as NotificationOrder[]).findIndex((o) => o.id === lastSeen);
          setUnreadCount(idx >= 0 ? idx : newOrders.length);
        } else {
          setUnreadCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.warn('Error polling notifications:', err);
    }
  }, [notifyNewOrder]);

  // Polling every 10 seconds
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    const interval = setInterval(() => {
      void fetchNotifications();
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    setUnreadCount(0);
    if (orders.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(LAST_SEEN_KEY, orders[0].id);
      lastKnownOrderId.current = orders[0].id;
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  return (
    <AdminNotificationContext.Provider
      value={{
        orders,
        pendingCount,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        permissionStatus,
        requestDesktopPermission,
        activeToast,
        dismissToast,
        markAllAsRead,
        playTestSound,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationProvider');
  }
  return context;
}
