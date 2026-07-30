import Link from "next/link";

import { RecordSaleForm } from "@/components/admin/growth/RecordSaleForm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, duration_days")
    .eq("is_active", true)
    .order("duration_days", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    console.error("Unable to load products:", error);

    throw new Error("Unable to load products.");
  }

  const products = (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    durationDays: product.duration_days,
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/sales"
          className="text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          ← Back to Sales
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Growth OS
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
          Record Sale
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Record a KofSports membership payment received
          through Venmo, PayPal, Cash App, cash, or another
          manual method.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No active products are available. Add or activate a
          product before recording a sale.
        </div>
      ) : (
        <RecordSaleForm products={products} />
      )}
    </main>
  );
}