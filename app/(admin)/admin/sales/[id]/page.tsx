import Link from "next/link";
import { notFound } from "next/navigation";

import SaleEditor, {
  type EditableSale,
} from "@/components/admin/sales/SaleEditor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SalePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type OrderRow = {
  id: string;
  order_number: number | string;
  customer_name: string | null;
  customer_email: string | null;
  source: string;
  total: number | string;
  notes: string | null;
  sold_at: string;
  status: string;
  order_items:
    | {
        product_name: string | null;
      }[]
    | null;
  payments:
    | {
        method: string;
        processor: string | null;
      }[]
    | null;
};

export default async function SaleDetailPage({
  params,
}: SalePageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      source,
      total,
      notes,
      sold_at,
      status,
      order_items (
        product_name
      ),
      payments (
        method,
        processor
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load sale:", error);
    throw new Error("Unable to load sale.");
  }

  if (!data) {
    notFound();
  }

  const order = data as OrderRow;
  const firstItem = order.order_items?.[0];
  const firstPayment = order.payments?.[0];

  const isProtectedStripeSale =
    order.source === "website" &&
    order.payments?.some(
      (payment) => payment.processor === "stripe",
    );

  const sale: EditableSale = {
    id: order.id,
    orderNumber: String(order.order_number),
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    source: order.source,
    amount: Number(order.total),
    notes: order.notes,
    soldAt: order.sold_at,
    status: order.status,
    productName: firstItem?.product_name ?? null,
    paymentMethod: firstPayment?.method ?? null,
    paymentProcessor:
      firstPayment?.processor ?? null,
    isProtectedStripeSale:
      Boolean(isProtectedStripeSale),
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/sales"
          className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          ← Back to Sales
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Growth OS Sales
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Order #{sale.orderNumber}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review, edit, or remove this sale record.
        </p>
      </div>

      <SaleEditor sale={sale} />
    </main>
  );
}