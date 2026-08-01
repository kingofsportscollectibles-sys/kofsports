import type { Customer360 } from "@/lib/growth/customer360";

type LeadProfileCardProps = {
  customer: Customer360;
};

function formatLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function LeadProfileCard({
  customer,
}: LeadProfileCardProps) {
  const { lead, membership, revenue } = customer;

  const leadDetails = [
    ["Platform", formatLabel(lead.platform)],
    ["CRM Status", formatLabel(lead.status)],
    ["Source", formatLabel(lead.source)],
    ["Location", lead.location || "Not set"],
    ["Last Contact", formatDate(lead.lastContactAt)],
    ["Created", formatDate(lead.createdAt)],
  ];

  const membershipDetails = [
    ["Tier", formatLabel(membership.membership)],
    [
      "Subscription",
      formatLabel(membership.subscriptionStatus),
    ],
    ["Expires", formatDate(membership.expiresAt)],
  ];

  const revenueDetails = [
    [
      "Lifetime Value",
      formatCurrency(revenue.lifetimeValue),
    ],
    ["Total Orders", revenue.totalOrders.toString()],
    [
      "Average Order",
      formatCurrency(revenue.averageOrderValue),
    ],
    [
      "Last Purchase",
      formatDate(revenue.lastPurchaseAt),
    ],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Customer 360
        </p>

        <h2 className="mt-1 text-lg font-black text-slate-950">
          Customer Profile
        </h2>
      </div>

      <div className="space-y-6 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Lead Details
          </p>

          <dl className="mt-4 space-y-4">
            {leadDetails.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-sm font-semibold text-slate-500">
                  {label}
                </dt>

                <dd className="text-right text-sm font-bold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Membership
          </p>

          <dl className="mt-4 space-y-4">
            {membershipDetails.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-sm font-semibold text-slate-500">
                  {label}
                </dt>

                <dd className="text-right text-sm font-bold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Revenue
          </p>

          <dl className="mt-4 space-y-4">
            {revenueDetails.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-sm font-semibold text-slate-500">
                  {label}
                </dt>

                <dd className="text-right text-sm font-bold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-500">
            Favorite Sports
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {lead.favoriteSports.length > 0 ? (
              lead.favoriteSports.map((sport) => (
                <span
                  key={sport}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  {sport.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">
                None added
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-500">
            Notes
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {lead.notes || "No notes have been added yet."}
          </p>
        </div>

        {lead.profileUrl ? (
          <div className="border-t border-slate-100 pt-5">
            <a
              href={lead.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-600"
            >
              Open social profile ↗
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
