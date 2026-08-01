"use client";

import { useActionState } from "react";

import {
  deleteSaleAction,
  type SaleActionState,
  updateSaleAction,
} from "@/app/(admin)/admin/sales/[id]/actions";

export type EditableSale = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  source: string;
  amount: number;
  notes: string | null;
  soldAt: string;
  status: string;
  productName: string | null;
  paymentMethod: string | null;
  paymentProcessor: string | null;
  isProtectedStripeSale: boolean;
};

type SaleEditorProps = {
  sale: EditableSale;
};

const initialState: SaleActionState = {
  status: "idle",
  message: "",
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function StatusMessage({
  state,
}: {
  state: SaleActionState;
}) {
  if (state.status === "idle") {
    return null;
  }

  const className =
    state.status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      {state.message}
    </div>
  );
}

export default function SaleEditor({
  sale,
}: SaleEditorProps) {
  const boundUpdateAction = updateSaleAction.bind(
    null,
    sale.id,
  );

  const boundDeleteAction = deleteSaleAction.bind(
    null,
    sale.id,
  );

  const [updateState, updateFormAction, updatePending] =
    useActionState(
      boundUpdateAction,
      initialState,
    );

  const [deleteState, deleteFormAction, deletePending] =
    useActionState(
      boundDeleteAction,
      initialState,
    );

  return (
    <div className="space-y-6">
      {sale.isProtectedStripeSale ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-black text-blue-900">
            Protected Stripe sale
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-700">
            Website purchases processed through Stripe cannot
            be edited or permanently deleted here. A refund or
            cancellation workflow will be added separately.
          </p>
        </div>
      ) : null}

      <form
        action={updateFormAction}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Sale Details
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Edit Order #{sale.orderNumber}
          </h2>
        </div>

        <div className="mt-6">
          <StatusMessage state={updateState} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Customer Name
            </span>

            <input
              name="customerName"
              type="text"
              defaultValue={sale.customerName ?? ""}
              disabled={sale.isProtectedStripeSale}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Customer Email
            </span>

            <input
              name="customerEmail"
              type="email"
              defaultValue={sale.customerEmail ?? ""}
              disabled={sale.isProtectedStripeSale}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Amount
            </span>

            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={sale.amount.toFixed(2)}
              disabled={sale.isProtectedStripeSale}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Sale Date
            </span>

            <input
              name="soldAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(sale.soldAt)}
              disabled={sale.isProtectedStripeSale}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Source
            </span>

            <select
              name="source"
              defaultValue={sale.source}
              disabled={sale.isProtectedStripeSale}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="website">Website</option>
              <option value="manual">Manual</option>
              <option value="referral">Referral</option>
              <option value="promotion">Promotion</option>
              <option value="partner">Partner</option>
              <option value="giveaway">Giveaway</option>
              <option value="import">Import</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Payment
            </p>

            <p className="mt-2 text-sm font-bold text-slate-800">
              {sale.paymentMethod ?? "Not recorded"}
              {sale.paymentProcessor
                ? ` via ${sale.paymentProcessor}`
                : ""}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Product: {sale.productName ?? "Not recorded"}
            </p>
          </div>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-bold text-slate-700">
            Notes
          </span>

          <textarea
            name="notes"
            rows={4}
            defaultValue={sale.notes ?? ""}
            disabled={sale.isProtectedStripeSale}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </label>

        {!sale.isProtectedStripeSale ? (
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updatePending}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {updatePending
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        ) : null}
      </form>

      {!sale.isProtectedStripeSale ? (
        <form
          action={deleteFormAction}
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
            Danger Zone
          </p>

          <h2 className="mt-2 text-xl font-black text-red-950">
            Delete Sale
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-700">
            This removes the order, order items, payments,
            membership event tied to the order, and related CRM
            purchase activity. It does not automatically change
            the customer&apos;s current profile membership.
          </p>

          <div className="mt-5">
            <StatusMessage state={deleteState} />
          </div>

          <label className="mt-5 block max-w-sm space-y-2">
            <span className="text-sm font-bold text-red-900">
              Type DELETE to confirm
            </span>

            <input
              name="confirmation"
              type="text"
              autoComplete="off"
              placeholder="DELETE"
              required
              className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-slate-950"
            />
          </label>

          <button
            type="submit"
            disabled={deletePending}
            className="mt-5 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {deletePending
              ? "Deleting..."
              : "Permanently Delete Sale"}
          </button>
        </form>
      ) : null}
    </div>
  );
}