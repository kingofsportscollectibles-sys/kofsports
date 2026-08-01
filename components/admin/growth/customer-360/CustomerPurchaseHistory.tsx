import type { CustomerOrder } from "@/lib/growth/customer360";

type CustomerPurchaseHistoryProps = {
  orders: CustomerOrder[];
};

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

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStatusClassName(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "bg-emerald-100 text-emerald-700";

    case "pending":
      return "bg-amber-100 text-amber-700";

    case "refunded":
    case "partially_refunded":
      return "bg-violet-100 text-violet-700";

    case "canceled":
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function CustomerPurchaseHistory({
  orders,
}: CustomerPurchaseHistoryProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Commerce
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-950">
            Purchase History
          </h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
          {orders.length}{" "}
          {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            🛒
          </div>

          <h3 className="mt-4 text-sm font-black text-slate-900">
            No purchases yet
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Completed purchases will appear here once this lead becomes a
            customer.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <article
              key={order.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-slate-950">
                    Order #{order.orderNumber}
                  </p>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getStatusClassName(
                      order.status,
                    )}`}
                  >
                    {formatLabel(order.status)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                  <span>{formatDate(order.soldAt)}</span>

                  {order.source ? (
                    <span>
                      Source: {formatLabel(order.source)}
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="shrink-0 text-lg font-black text-slate-950">
                {formatCurrency(order.total)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}