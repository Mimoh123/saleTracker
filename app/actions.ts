"use server";

import { getSalesCollection } from "@/lib/db";
import type { SaleEntry, PaymentType } from "@/lib/types";

function docToEntry(doc: SaleEntry): SaleEntry {
  return {
    id: doc.id,
    productName: doc.productName ?? "",
    amount: Number(doc.amount) || 0,
    paymentType: doc.paymentType ?? "cash",
    date: doc.date ?? "",
    createdAt: Number(doc.createdAt) || 0,
  };
}

export async function getSales(): Promise<{
  entries: SaleEntry[];
  error?: string;
}> {
  try {
    const coll = await getSalesCollection();
    const docs = await coll.find({}).sort({ createdAt: -1 }).toArray();
    return { entries: docs.map(docToEntry) };
  } catch (e) {
    console.error("getSales error:", e);
    const isConnectionError =
      e instanceof Error &&
      (e.message.includes("ECONNREFUSED") ||
        e.message.includes("MongoServerSelectionError") ||
        (e.cause as Error)?.message?.includes("ECONNREFUSED"));
    return {
      entries: [],
      error: isConnectionError
        ? "Could not connect to MongoDB. Make sure MongoDB is running and MONGODB_URI in .env.local is correct."
        : e instanceof Error ? e.message : "Failed to load sales",
    };
  }
}

export async function addSale(formData: {
  productName: string;
  amount: number;
  paymentType: PaymentType;
}): Promise<{ success: boolean; entries: SaleEntry[]; error?: string }> {
  try {
    const amount = Number(formData.amount) || 0;
    if (amount <= 0) {
      const { entries } = await getSales();
      return { success: false, entries, error: "Amount must be greater than 0" };
    }
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const newEntry: SaleEntry = {
      id: crypto.randomUUID(),
      productName: (formData.productName ?? "").trim(),
      amount,
      paymentType: formData.paymentType ?? "cash",
      date: dateStr,
      createdAt: Date.now(),
    };
    const coll = await getSalesCollection();
    await coll.insertOne(newEntry);
    const { entries } = await getSales();
    return { success: true, entries };
  } catch (e) {
    console.error("addSale error:", e);
    const { entries, error: loadError } = await getSales();
    return {
      success: false,
      entries,
      error: e instanceof Error ? e.message : loadError ?? "Failed to add sale",
    };
  }
}

export async function deleteSale(
  id: string
): Promise<{ success: boolean; entries: SaleEntry[]; error?: string }> {
  try {
    const coll = await getSalesCollection();
    await coll.deleteOne({ id });
    const { entries } = await getSales();
    return { success: true, entries };
  } catch (e) {
    console.error("deleteSale error:", e);
    const { entries, error: loadError } = await getSales();
    return {
      success: false,
      entries,
      error: e instanceof Error ? e.message : loadError ?? "Failed to delete sale",
    };
  }
}
