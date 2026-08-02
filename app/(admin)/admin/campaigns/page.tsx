import Link from "next/link";

import {
  getCampaignDashboard,
  type GrowthCampaignStatus,
} from "@/lib/growth/campaigns";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStatusClasses(
  status: GrowthCampaignStatus,
) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";

    case "scheduled":
      return "bg-blue-100 text-blue-700";

    case "paused":
      return "bg-amber-100 text-amber-700";

    case "completed":
      return "bg-violet-100 text-violet-700";

    case "canceled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

export default async function CampaignsPage() {
  const { campaigns, summary } =
    await getCampaignDashboard();

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
            Growth OS
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Campaigns
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Organize targeted outreach, track lead
            engagement, and connect campaign activity to
            conversions and revenue.
          </p>
        </div>

        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
        >
          + New Campaign
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Campaigns"
          value={summary.activeCampaigns.toString()}
          helper={`${summary.totalCampaigns} total campaigns`}
        />

        <MetricCard
          label="Leads Contacted"
          value={summary.contactedCount.toString()}
          helper={`${summary.totalMembers} total campaign members`}
        />

        <MetricCard
          label="Reply Rate"
          value={formatPercent(summary.replyRate)}
          helper={`${summary.repliedCount} replies recorded`}
        />

        <MetricCard
          label="Attributed Revenue"
          value={formatCurrency(
            summary.attributedRevenue,
          )}
          helper={`${summary.convertedCount} conversions`}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              All Campaigns
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Draft, active, scheduled, and completed
              growth initiatives.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
            {campaigns.length}{" "}
            {campaigns.length === 1
              ? "campaign"
              : "campaigns"}
          </span>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📣
            </div>

            <h3 className="mt-4 text-base font-black text-slate-950">
              No campaigns yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Create your first campaign to organize lead
              outreach and measure replies, conversions, and
              revenue.
            </p>

            <Link
              href="/admin/campaigns/new"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((campaign) => {
              const replyRate =
                campaign.contactedCount > 0
                  ? (campaign.repliedCount /
                      campaign.contactedCount) *
                    100
                  : 0;

              const conversionRate =
                campaign.contactedCount > 0
                  ? (campaign.convertedCount /
                      campaign.contactedCount) *
                    100
                  : 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/admin/campaigns/${campaign.id}`}
                  className="block px-6 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {campaign.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusClasses(
                            campaign.status,
                          )}`}
                        >
                          {formatLabel(campaign.status)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {campaign.description ||
                          campaign.audienceDescription ||
                          "No campaign description added."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                        <span>
                          Platform:{" "}
                          {formatLabel(campaign.platform)}
                        </span>

                        <span>
                          Type:{" "}
                          {formatLabel(
                            campaign.campaignType,
                          )}
                        </span>

                        <span>
                          Starts:{" "}
                          {formatDate(campaign.startsAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xl font-black text-slate-950">
                          {campaign.totalMembers}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Leads
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xl font-black text-slate-950">
                          {formatPercent(replyRate)}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Reply Rate
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xl font-black text-slate-950">
                          {formatPercent(conversionRate)}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Conversion
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 px-4 py-3">
                        <p className="text-xl font-black text-emerald-800">
                          {formatCurrency(
                            campaign.revenueAttributed,
                          )}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                          Revenue
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}