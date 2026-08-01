import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

import ClickableOrderRow from "@/components/admin/sales/ClickableOrderRow";

export const dynamic = "force-dynamic";

type OrderItem = {
  product_name: string | null;
  quantity: number;
  unit_price: number | string;
};

type Payment = {
  method: string;
  processor: string | null;
  status: string;
};

type Order = {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  source: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  sold_at: string;
  order_items: OrderItem[] | null;
  payments: Payment[] | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getStartOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function getStartOfMonth() {
  const date = new Date();

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getCustomerDisplay(order: Order) {
  return (
    order.customer_name ||
    order.customer_email ||
    "Unknown customer"
  );
}

function getProductDisplay(order: Order) {
  const items = order.order_items ?? [];

  if (items.length === 0) {
    return "No product";
  }

  if (items.length === 1) {
    return items[0].product_name ?? "Product";
  }

  return `${items[0].product_name ?? "Product"} +${
    items.length - 1
  } more`;
}

function getPaymentMethod(order: Order) {
  const payment = order.payments?.[0];

  if (!payment) {
    return "—";
  }

  return formatLabel(payment.method);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "refunded":
    case "partially_refunded":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "failed":
    case "canceled":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-gray-50 text-gray-700 ring-gray-600/20";
  }
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {helper}
      </p>
    </div>
  );
}

export default async function SalesPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      status,
      source,
      subtotal,
      discount,
      total,
      sold_at,
      order_items (
        product_name,
        quantity,
        unit_price
      ),
      payments (
        method,
        processor,
        status
      )
    `)
    .order("sold_at", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error("Unable to load sales dashboard:", error);

    throw new Error("Unable to load sales dashboard.");
  }

  const orders = (data ?? []) as Order[];

  /*
   * Revenue only includes orders currently considered paid.
   * Refund-aware net revenue can be added once refund handling
   * is built into the Sales module.
   */
  const paidOrders = orders.filter(
    (order) =>
      order.status === "paid" ||
      order.status === "partially_refunded",
  );

  const todayStart = getStartOfToday();
  const monthStart = getStartOfMonth();

  const lifetimeRevenue = paidOrders.reduce(
    (total, order) => total + toNumber(order.total),
    0,
  );

  const revenueToday = paidOrders
    .filter(
      (order) => new Date(order.sold_at) >= todayStart,
    )
    .reduce(
      (total, order) =>
        total + toNumber(order.total),
      0,
    );

  const revenueThisMonth = paidOrders
    .filter(
      (order) => new Date(order.sold_at) >= monthStart,
    )
    .reduce(
      (total, order) =>
        total + toNumber(order.total),
      0,
    );

  const averageOrderValue =
    paidOrders.length > 0
      ? lifetimeRevenue / paidOrders.length
      : 0;

  const websiteRevenue = paidOrders
    .filter((order) => order.source === "website")
    .reduce(
      (total, order) =>
        total + toNumber(order.total),
      0,
    );

  const manualRevenue = paidOrders
    .filter((order) => order.source === "manual")
    .reduce(
      (total, order) =>
        total + toNumber(order.total),
      0,
    );

  const recentOrders = orders.slice(0, 10);

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Growth OS
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Sales
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Track KofSports revenue across website
            purchases, Stripe, Venmo, PayPal, Cash App,
            and other manual payments.
          </p>
        </div>

        <Link
          href="/admin/sales/new"
          className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          + Record Sale
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue Today"
          value={formatCurrency(revenueToday)}
          helper="Paid orders recorded today"
        />

        <MetricCard
          label="Revenue This Month"
          value={formatCurrency(revenueThisMonth)}
          helper={`${paidOrders.filter(
            (order) =>
              new Date(order.sold_at) >= monthStart,
          ).length} paid orders this month`}
        />

        <MetricCard
          label="Lifetime Revenue"
          value={formatCurrency(lifetimeRevenue)}
          helper={`${paidOrders.length} total paid orders`}
        />

        <MetricCard
          label="Average Order"
          value={formatCurrency(averageOrderValue)}
          helper="Average paid order value"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Website Revenue
          </p>

          <p className="mt-3 text-2xl font-bold text-gray-950">
            {formatCurrency(websiteRevenue)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Purchases recorded through the KofSports
            website
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Manual Revenue
          </p>

          <p className="mt-3 text-2xl font-bold text-gray-950">
            {formatCurrency(manualRevenue)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Venmo, PayPal, Cash App, cash, and other
            manually recorded payments
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The latest membership purchases and manual
              sales.
            </p>
          </div>

          <p className="text-sm font-medium text-gray-500">
            {orders.length} recorded
          </p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
              $
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-950">
              No sales recorded yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Record your first manual membership sale to
              begin tracking revenue in Growth OS.
            </p>

            <Link
              href="/admin/sales/new"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Record First Sale
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Order
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Source
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {recentOrders.map((order) => (
<ClickableOrderRow
  key={order.id}
  href={`/admin/sales/${order.id}`}
>
  <td className="whitespace-nowrap px-6 py-4">
    <p className="text-sm font-semibold text-gray-950">
      #{order.order_number}
    </p>

    <p className="mt-1 text-xs text-gray-500">
      {formatDate(order.sold_at)}
    </p>
  </td>

  <td className="px-6 py-4">
    <p className="text-sm font-medium text-gray-950">
      {getCustomerDisplay(order)}
    </p>

    {order.customer_name &&
    order.customer_email ? (
      <p className="mt-1 text-xs text-gray-500">
        {order.customer_email}
      </p>
    ) : null}
  </td>

  <td className="px-6 py-4 text-sm text-gray-700">
    {getProductDisplay(order)}
  </td>

  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
    {getPaymentMethod(order)}
  </td>

  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
    {formatLabel(order.source)}
  </td>

  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-950">
    {formatCurrency(toNumber(order.total))}
  </td>

  <td className="whitespace-nowrap px-6 py-4">
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
        order.status,
      )}`}
    >
      {formatLabel(order.status)}
    </span>
  </td>
</ClickableOrderRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}