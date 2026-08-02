import Link from "next/link";
import { notFound } from "next/navigation";

import AddCampaignLeadsForm, {
  type CampaignLeadOption,
} from "@/components/admin/campaigns/AddCampaignLeadsForm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AddCampaignLeadsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type GrowthLeadRow = {
  id: string;
  name: string | null;
  username: string | null;
  platform: string;
  status: string;
  lead_score: number | null;
  source: string | null;
};

export default async function AddCampaignLeadsPage({
  params,
}: AddCampaignLeadsPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    campaignResult,
    leadsResult,
    membersResult,
  ] = await Promise.all([
    supabase
      .from("growth_campaigns")
      .select("id, name")
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("growth_leads")
      .select(`
        id,
        name,
        username,
        platform,
        status,
        lead_score,
        source
      `)
      .order("lead_score", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("growth_campaign_members")
      .select("lead_id")
      .eq("campaign_id", id),
  ]);

  if (campaignResult.error) {
    console.error(
      "Unable to load campaign:",
      campaignResult.error,
    );

    throw new Error("Unable to load campaign.");
  }

  if (!campaignResult.data) {
    notFound();
  }

  if (leadsResult.error) {
    console.error(
      "Unable to load campaign leads:",
      leadsResult.error,
    );

    throw new Error("Unable to load leads.");
  }

  if (membersResult.error) {
    console.error(
      "Unable to load campaign members:",
      membersResult.error,
    );

    throw new Error(
      "Unable to load campaign members.",
    );
  }

  const existingMemberIds = new Set(
    (membersResult.data ?? []).map(
      (member) => member.lead_id,
    ),
  );

  const leads: CampaignLeadOption[] = (
    (leadsResult.data ?? []) as GrowthLeadRow[]
  )
    .filter(
      (lead) => !existingMemberIds.has(lead.id),
    )
    .map((lead) => ({
      id: lead.id,
      displayName:
        lead.name ||
        lead.username ||
        "Unnamed Lead",
      username: lead.username,
      platform: lead.platform,
      status: lead.status,
      leadScore: lead.lead_score ?? 0,
      source: lead.source,
    }));

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href={`/admin/campaigns/${id}`}
          className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          ← Back to Campaign
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
          Growth OS Campaigns
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Add Leads
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select CRM leads for{" "}
          <span className="font-black text-slate-950">
            {campaignResult.data.name}
          </span>
          .
        </p>
      </div>

      <AddCampaignLeadsForm
        campaignId={id}
        leads={leads}
      />
    </main>
  );
}