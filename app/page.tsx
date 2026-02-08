"use client";

import { useState, useEffect, useCallback } from "react";
import { getSales, addSale as addSaleAction, updateSale as updateSaleAction, deleteSale as deleteSaleAction } from "./actions";
import type { SaleEntry, PaymentType } from "@/lib/types";

type FilterKey = "today" | "yesterday" | "lastWeek" | "thisMonth" | "lastMonth";

type PaymentFilterKey = "all" | PaymentType;

const PAYMENT_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "qr", label: "QR" },
  { value: "loan", label: "Loan" },
];

const PAYMENT_FILTER_OPTIONS: { value: PaymentFilterKey; label: string }[] = [
  { value: "all", label: "All" },
  ...PAYMENT_OPTIONS,
];

function getStartEndForFilter(filter: FilterKey): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);

  switch (filter) {
    case "today": {
      const start = new Date(today);
      return { start, end };
    }
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      const endDay = new Date(today);
      endDay.setMilliseconds(-1);
      return { start, end: endDay };
    }
    case "lastWeek": {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start, end: new Date(today) };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: new Date(now) };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: endLastMonth };
    }
    default:
      return { start: today, end: new Date(now) };
  }
}

function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

const FILTER_LABELS: Record<FilterKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  lastWeek: "Last 7 days",
  thisMonth: "This month",
  lastMonth: "Last month",
};

export default function Home() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [filter, setFilter] = useState<FilterKey>("today");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterKey>("all");
  const [inputProductName, setInputProductName] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [inputPaymentType, setInputPaymentType] = useState<PaymentType>("cash");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>("cash");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSales()
      .then((result) => {
        if (!cancelled) {
          setEntries(result.entries);
          if (result.error) setError(result.error);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load sales");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setMounted(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addSale = useCallback(async () => {
    const value = parseFloat(inputAmount.replace(/,/g, "."));
    if (Number.isNaN(value) || value <= 0) return;
    setActionPending(true);
    setError(null);
    const result = await addSaleAction({
      productName: inputProductName,
      amount: value,
      paymentType: inputPaymentType,
    });
    setActionPending(false);
    if (result.success) {
      setEntries(result.entries);
      setInputProductName("");
      setInputAmount("");
      setInputPaymentType("cash");
    } else {
      setError(result.error ?? "Failed to add sale");
    }
  }, [inputProductName, inputAmount, inputPaymentType]);

  const startEditing = useCallback((entry: SaleEntry) => {
    setEditingId(entry.id);
    setEditProductName(entry.productName);
    setEditAmount(entry.amount.toString());
    setEditPaymentType(entry.paymentType);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditProductName("");
    setEditAmount("");
    setEditPaymentType("cash");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    const value = parseFloat(editAmount.replace(/,/g, "."));
    if (Number.isNaN(value) || value <= 0) return;
    setActionPending(true);
    setError(null);
    const result = await updateSaleAction(editingId, {
      productName: editProductName,
      amount: value,
      paymentType: editPaymentType,
    });
    setActionPending(false);
    if (result.success) {
      setEntries(result.entries);
      setEditingId(null);
      setEditProductName("");
      setEditAmount("");
      setEditPaymentType("cash");
    } else {
      setError(result.error ?? "Failed to update sale");
    }
  }, [editingId, editProductName, editAmount, editPaymentType]);

  const deleteEntry = useCallback(async (id: string) => {
    setActionPending(true);
    setError(null);
    if (editingId === id) setEditingId(null);
    const result = await deleteSaleAction(id);
    setActionPending(false);
    if (result.success) {
      setEntries(result.entries);
    } else {
      setError(result.error ?? "Failed to delete");
    }
  }, [editingId]);

  const { start, end } = getStartEndForFilter(filter);
  const byDate = entries.filter((e) => isDateInRange(e.date, start, end));
  const filtered =
    paymentFilter === "all"
      ? byDate
      : byDate.filter((e) => e.paymentType === paymentFilter);
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const filters: FilterKey[] = ["today", "yesterday", "lastWeek", "thisMonth", "lastMonth"];

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white text-[var(--foreground)] flex items-center justify-center text-xl">
        <div className="text-[var(--foreground-muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[var(--foreground)] font-sans">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        {error ? (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-5 py-4 text-lg text-red-800">
            {error}
          </div>
        ) : null}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Sales Tracker</h1>
          <p className="mt-2 text-lg text-[var(--foreground-muted)] sm:text-xl">
            Log today&apos;s sales and view by period
          </p>
        </header>

        {/* Today's sales input */}
        <section className="mb-8 rounded-2xl border-2 border-[var(--border)] bg-white p-5 shadow-sm sm:mb-10 sm:p-7">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)] sm:mb-5 sm:text-xl">
            Add today&apos;s sale
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="productName" className="mb-2 block text-base font-medium text-[var(--foreground-muted)] sm:text-lg">
                Product name
              </label>
              <input
                id="productName"
                type="text"
                placeholder="e.g. Rice, Oil"
                value={inputProductName}
                onChange={(e) => setInputProductName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSale()}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-5 py-4 text-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 sm:text-2xl"
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="flex-1">
                <label htmlFor="amount" className="mb-2 block text-base font-medium text-[var(--foreground-muted)] sm:text-lg">
                  Amount
                </label>
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSale()}
                  className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-5 py-4 text-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 sm:text-2xl"
                />
              </div>
              <div className="sm:w-36">
                <label htmlFor="paymentType" className="mb-2 block text-base font-medium text-[var(--foreground-muted)] sm:text-lg">
                  Payment
                </label>
                <select
                  id="paymentType"
                  value={inputPaymentType}
                  onChange={(e) => setInputPaymentType(e.target.value as PaymentType)}
                  className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-5 py-4 text-xl text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 sm:text-2xl"
                >
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addSale}
                disabled={actionPending}
                className="min-h-[52px] shrink-0 rounded-xl bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 sm:min-h-[56px] sm:px-8 sm:py-4 sm:text-xl"
              >
                {actionPending ? "Adding…" : "Add sale"}
              </button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 sm:mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)] sm:mb-5 sm:text-xl">
            View by period
          </h2>
          <div className="flex flex-wrap gap-3">
            {filters.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`min-h-[48px] min-w-[44px] rounded-xl px-5 py-3 text-base font-medium transition sm:min-h-[52px] sm:px-6 sm:py-3.5 sm:text-lg ${
                  filter === key
                    ? "bg-[var(--accent)] text-white"
                    : "border-2 border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            ))}
          </div>
        </section>

        {/* Payment type filter */}
        <section className="mb-6 sm:mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)] sm:mb-5 sm:text-xl">
            Filter by payment
          </h2>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentFilter(opt.value)}
                className={`min-h-[48px] min-w-[44px] rounded-xl px-5 py-3 text-base font-medium transition sm:min-h-[52px] sm:px-6 sm:py-3.5 sm:text-lg ${
                  paymentFilter === opt.value
                    ? "bg-[var(--accent)] text-white"
                    : "border-2 border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Summary & list */}
        <section className="rounded-2xl border-2 border-[var(--border)] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-lg text-[var(--foreground-muted)] sm:text-xl">
              {FILTER_LABELS[filter]}
              {paymentFilter !== "all" ? ` · ${paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)}` : ""}
            </span>
            <p className="text-3xl font-bold tabular-nums text-[var(--foreground)] sm:text-4xl">
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-lg text-[var(--foreground-muted)] sm:text-xl">
              No sales in this period{paymentFilter !== "all" ? " for this payment type" : ""}. Add a sale above or change filters.
            </p>
          ) : (
            <ul className="divide-y-2 divide-[var(--border)]">
              {filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="py-4 first:pt-0 sm:py-5"
                >
                  {editingId === entry.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Product name"
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none focus:border-[var(--accent)] sm:text-lg"
                      />
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[120px]">
                          <label className="mb-1 block text-sm text-[var(--foreground-muted)]">Amount</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none focus:border-[var(--accent)] sm:text-lg"
                          />
                        </div>
                        <div className="w-28">
                          <label className="mb-1 block text-sm text-[var(--foreground-muted)]">Payment</label>
                          <select
                            value={editPaymentType}
                            onChange={(e) => setEditPaymentType(e.target.value as PaymentType)}
                            className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          >
                            {PAYMENT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={actionPending}
                            className="rounded-xl bg-[var(--accent)] px-4 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {actionPending ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={actionPending}
                            className="rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-base font-medium text-[var(--foreground)] hover:bg-[var(--accent-muted)] disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-semibold tabular-nums text-[var(--foreground)] sm:text-2xl">
                          {entry.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        {entry.productName ? (
                          <p className="mt-0.5 text-base font-medium text-[var(--foreground)] sm:text-lg">
                            {entry.productName}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-base text-[var(--foreground-muted)] sm:text-lg">
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          <span className="capitalize">{entry.paymentType}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          disabled={actionPending}
                          className="rounded-xl p-3 text-[var(--foreground-muted)] transition hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] disabled:opacity-50 min-h-[48px] min-w-[48px] flex items-center justify-center"
                          aria-label="Edit this sale"
                        >
                          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          disabled={actionPending}
                          className="rounded-xl p-3 text-[var(--foreground-muted)] transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50 min-h-[48px] min-w-[48px] flex items-center justify-center"
                          aria-label="Delete this sale"
                        >
                          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
