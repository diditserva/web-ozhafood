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
