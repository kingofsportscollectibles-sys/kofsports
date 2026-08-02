import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getCampaignDetail,
  type GrowthCampaignStatus,
} from "@/lib/growth/campaigns";

import CampaignMemberRow from "@/components/admin/campaigns/CampaignMemberRow";

export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercent(
  numerator: number,
  denominator: number,
) {
  if (denominator === 0) {
    return "0.0%";
  }

  return `${(
    (numerator / denominator) *
    100
  ).toFixed(1)}%`;
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
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {helper}
      </p>
    </div>
  );
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;

  const campaign = await getCampaignDetail(id);

  if (!campaign) {
    notFound();
  }

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

const averageRevenuePerConversion =
  campaign.convertedCount > 0
    ? campaign.revenueAttributed /
      campaign.convertedCount
    : 0;

const budget = campaign.budgetCents / 100;

const roi =
  budget > 0
    ? ((campaign.revenueAttributed - budget) /
        budget) *
      100
    : null;

const remainingLeads = Math.max(
  campaign.members.length -
    campaign.contactedCount,
  0,
);

const goalProgress =
  campaign.goalValue &&
  campaign.goalValue > 0
    ? Math.min(
        campaign.goalType === "revenue"
          ? (campaign.revenueAttributed /
              campaign.goalValue) *
              100
          : campaign.goalType === "replies"
            ? (campaign.repliedCount /
                campaign.goalValue) *
              100
            : campaign.goalType ===
                "conversations"
              ? (campaign.contactedCount /
                  campaign.goalValue) *
                100
              : campaign.goalType ===
                  "conversions"
                ? (campaign.convertedCount /
                    campaign.goalValue) *
                  100
                : 0,
        100,
      )
    : 0;

  return (
    <main className="space-y-8">
      <div>
        <Link
          href="/admin/campaigns"
          className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          ← Back to Campaigns
        </Link>
      </div>

      <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(
                  campaign.status,
                )}`}
              >
                {formatLabel(campaign.status)}
              </span>

              <span className="text-sm font-bold text-slate-400">
                {formatLabel(campaign.platform)}
              </span>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              Campaign Workspace
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {campaign.name}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              {campaign.description ||
                "No campaign description has been added."}
            </p>
          </div>

          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
          >
            Edit Campaign
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Campaign Members"
          value={campaign.members.length.toString()}
          helper={`${campaign.targetLeadCount} target leads`}
        />

        <MetricCard
          label="Contacted"
          value={campaign.contactedCount.toString()}
          helper="Leads reached"
        />

        <MetricCard
          label="Reply Rate"
          value={formatPercent(
            campaign.repliedCount,
            campaign.contactedCount,
          )}
          helper={`${campaign.repliedCount} replies`}
        />

        <MetricCard
          label="Conversions"
          value={campaign.convertedCount.toString()}
          helper={formatPercent(
            campaign.convertedCount,
            campaign.contactedCount,
          )}
        />

        <MetricCard
          label="Revenue"
          value={formatCurrency(
            campaign.revenueAttributed,
          )}
          helper="Attributed to campaign"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
        Campaign Analytics
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        Performance Overview
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Outreach efficiency, conversion performance, and
        revenue impact.
      </p>
    </div>

    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
      {campaign.members.length} total leads
    </span>
  </div>

  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        Reply Rate
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {replyRate.toFixed(1)}%
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {campaign.repliedCount} of{" "}
        {campaign.contactedCount} contacted
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        Conversion Rate
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {conversionRate.toFixed(1)}%
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {campaign.convertedCount} conversions
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        Avg. Conversion Value
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {formatCurrency(
          averageRevenuePerConversion,
        )}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Revenue per converted lead
      </p>
    </div>

    <div className="rounded-xl bg-emerald-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
        Campaign ROI
      </p>

      <p className="mt-2 text-2xl font-black text-emerald-800">
        {roi === null
          ? "No spend"
          : `${roi.toFixed(1)}%`}
      </p>

      <p className="mt-1 text-xs text-emerald-700">
        {formatCurrency(
          campaign.revenueAttributed,
        )}{" "}
        revenue on {formatCurrency(budget)} spend
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-5 lg:grid-cols-2">
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Audience Progress
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {campaign.contactedCount} contacted
          </p>
        </div>

        <p className="text-sm font-bold text-slate-500">
          {remainingLeads} remaining
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{
            width: `${
              campaign.members.length > 0
                ? Math.min(
                    (campaign.contactedCount /
                      campaign.members.length) *
                      100,
                    100,
                  )
                : 0
            }%`,
          }}
        />
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Goal Progress
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {formatLabel(campaign.goalType)}
          </p>
        </div>

        <p className="text-sm font-bold text-slate-500">
          {goalProgress.toFixed(0)}%
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{
            width: `${goalProgress}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500">
        Target:{" "}
        {campaign.goalValue !== null
          ? campaign.goalType === "revenue"
            ? formatCurrency(campaign.goalValue)
            : campaign.goalValue
          : "No goal set"}
      </p>
    </div>
  </div>
</section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Campaign Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track outreach, replies, interest, and
                conversions.
              </p>
            </div>

            <Link
  href={`/admin/campaigns/${campaign.id}/add-leads`}
  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
>
  + Add Leads
</Link>
          </div>

          {campaign.members.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-3xl">👥</div>

              <h3 className="mt-4 font-black text-slate-950">
                No leads added yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add CRM leads to begin tracking campaign
                outreach and results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Lead
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Score
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {campaign.members.map((member) => (
  <CampaignMemberRow
    key={member.leadId}
    campaignId={campaign.id}
    member={member}
  />
))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Campaign Details
            </h2>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Type
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatLabel(campaign.campaignType)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Start
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatDate(campaign.startsAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  End
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatDate(campaign.endsAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Goal
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatLabel(campaign.goalType)}
                  {campaign.goalValue !== null
                    ? `: ${campaign.goalValue}`
                    : ""}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Budget
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatCurrency(
                    campaign.budgetCents / 100,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Audience
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {campaign.audienceDescription ||
                "No audience description added."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="text-lg font-black">
              Message Template
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {campaign.messageTemplate ||
                "No outreach message added."}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}