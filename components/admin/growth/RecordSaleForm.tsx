"use client";

import { useActionState, useState } from "react";

import {
  recordSaleAction,
  type RecordSaleState,
} from "@/app/(admin)/admin/sales/new/actions";

type Product = {
  id: string;
  name: string;
  price: number;
  durationDays: number | null;
};

const initialState: RecordSaleState = {};

export function RecordSaleForm({
  products,
}: {
  products: Product[];
}) {
  const [state, formAction, pending] = useActionState(
    recordSaleAction,
    initialState,
  );

  const [selectedProductId, setSelectedProductId] =
    useState(products[0]?.id ?? "");

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">
          Customer
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Customer Name
            </span>

            <input
              name="customerName"
              type="text"
              placeholder="John Smith"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Customer Email
            </span>

            <input
              name="customerEmail"
              type="email"
              placeholder="john@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Enter at least a name or email address.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">
          Sale Details
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Product
            </span>

            <select
              name="productId"
              value={selectedProductId}
              onChange={(event) =>
                setSelectedProductId(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            >
              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Amount
            </span>

            <input
              key={selectedProduct?.id}
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                selectedProduct?.price.toFixed(2) ?? ""
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Payment Method
            </span>

            <select
              name="paymentMethod"
              defaultValue="venmo"
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            >
              <option value="venmo">Venmo</option>
              <option value="paypal">PayPal</option>
              <option value="cash_app">Cash App</option>
              <option value="zelle">Zelle</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">
                Bank Transfer
              </option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Sale Source
            </span>

            <select
              name="source"
              defaultValue="manual"
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            >
              <option value="manual">Manual</option>
              <option value="referral">Referral</option>
              <option value="promotion">Promotion</option>
              <option value="partner">Partner</option>
              <option value="giveaway">Giveaway</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Sale Date
            </span>

            <input
              name="saleDate"
              type="date"
              defaultValue={new Date()
                .toISOString()
                .slice(0, 10)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Notes
          </span>

          <textarea
            name="notes"
            rows={4}
            placeholder="Paid through Venmo after an X conversation."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-gray-950"
          />
        </label>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || products.length === 0}
          className="inline-flex min-w-36 items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Recording..." : "Record Sale"}
        </button>
      </div>
    </form>
  );
}