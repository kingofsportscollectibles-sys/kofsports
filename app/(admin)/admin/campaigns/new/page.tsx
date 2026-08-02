import Link from "next/link";

import CampaignForm from "@/components/admin/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/campaigns"
          className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          ← Back to Campaigns
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
          Growth OS
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Create Campaign
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Define the audience, channel, objective, and message
          for a measurable KofSports growth initiative.
        </p>
      </div>

      <CampaignForm />
    </main>
  );
}