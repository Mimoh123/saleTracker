export type PaymentType = "cash" | "qr" | "loan";

export interface SaleEntry {
  id: string;
  productName: string;
  amount: number;
  paymentType: PaymentType;
  date: string;
  createdAt: number;
}
