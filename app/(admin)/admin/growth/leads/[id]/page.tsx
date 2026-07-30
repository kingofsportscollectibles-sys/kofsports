import { notFound } from "next/navigation";

import ActivityTimeline from "@/components/admin/growth/activity/ActivityTimeline";
import ActivityComposer from "@/components/admin/growth/lead-workspace/ActivityComposer";
import LeadHeader from "@/components/admin/growth/lead-workspace/LeadHeader";
import LeadInsights from "@/components/admin/growth/lead-workspace/LeadInsights";
import LeadIntelligenceCards from "@/components/admin/growth/lead-workspace/LeadIntelligenceCards";
import LeadProfileCard from "@/components/admin/growth/lead-workspace/LeadProfileCard";

import { getLeadActivities } from "@/lib/growth/activity";
import { getGrowthLead } from "@/lib/growth/lead";

type GrowthLeadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GrowthLeadPage({
  params,
}: GrowthLeadPageProps) {
  const { id } = await params;

  const lead = await getGrowthLead(id);

  if (!lead) {
    notFound();
  }

  const activities = await getLeadActivities(lead.id);

  return (
    <div className="space-y-6">
      <LeadHeader
        lead={lead}
        activities={activities}
      />

      <LeadIntelligenceCards
        lead={lead}
        activities={activities}
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <LeadProfileCard lead={lead} />

        <main className="space-y-5">
          <ActivityComposer leadId={lead.id} />

          <ActivityTimeline activities={activities} />
        </main>

        <LeadInsights
          lead={lead}
          activities={activities}
        />
      </div>
    </div>
  );
}
