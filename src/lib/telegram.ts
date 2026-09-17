import { formatDateIndo, formatRupiah } from './constants';

interface OrderItem {
  productName: string;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  orderCode: string;
  customerName: string;
  division: string;
  location: string;
  targetDate: Date | string;
  notes?: string | null;
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[];
}

/**
 * Mengirim notifikasi pesanan baru ke Telegram Bot Admin jika token & chat_id tersedia di environment variable.
 */
export async function sendTelegramOrderNotification(order: OrderData): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  try {
    let itemsText = '';
    order.items.forEach((item) => {
      itemsText += `  • ${item.productName} x${item.quantity} (${formatRupiah(item.subtotal)})\n`;
    });

    const targetDateFormatted = formatDateIndo(order.targetDate);
    const payment = order.paymentMethod === 'QRIS' ? 'QRIS' : 'Transfer Bank';
    const notesText = order.notes ? `\n📝 *Catatan:* ${order.notes}` : '';

    const message = `🔔 *PESANAN BARU MASUK!*
━━━━━━━━━━━━━━━━━━━━
📦 *No. Order:* #${order.orderCode}
👤 *Pemesan:* ${order.customerName}
🏢 *Divisi:* ${order.division}
📍 *Lokasi:* ${order.location}
📅 *Tanggal Kirim:* ${targetDateFormatted}

🛒 *Menu Pesanan:*
${itemsText}${notesText}
💰 *Total:* ${formatRupiah(order.totalAmount)}
💳 *Metode:* ${payment}
━━━━━━━━━━━━━━━━━━━━
👉 *Cek Dashboard Admin untuk proses pesanan.*`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('Failed to send Telegram notification:', errJson);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error sending Telegram notification:', error);
    return false;
  }
}
