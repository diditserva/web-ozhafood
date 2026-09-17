export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export const ADMIN_WA_NUMBER = "6285648020406";

export const BANK_ACCOUNTS = [
  {
    bank: "BANK BNI",
    number: "1438940326",
    holder: "a/n Didit Serva",
  },
  {
    bank: "BANK BCA",
    number: "0183545679",
    holder: "a/n Didit Serva",
  },
];

export const QRIS_IMAGE_DATA = "/qris-ozhafood.svg";

export const DEFAULT_DIVISIONS = [
  "General",
  "IT & Tech",
  "Marketing",
  "Finance",
  "HRD & GA",
  "Operations",
  "Sales",
];

export const DEFAULT_LOCATIONS = [
  "Lantai 1",
  "Lantai 2",
  "Lantai 3",
  "Lantai 4",
  "Lobi Utama",
  "Pantry",
];

export const FOOD_EMOJIS: Record<string, string> = {
  pentol: "🧆",
  siomay: "🥟",
  tahu: "🧊",
  gorengan: "🥠",
  minuman: "🥤",
  es: "🍹",
  teh: "🍵",
  kopi: "☕",
};

export function formatRupiah(amount: number): string {
  return "Rp " + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatDateIndo(dateStrOrObj: string | Date): string {
  const d = new Date(dateStrOrObj);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
