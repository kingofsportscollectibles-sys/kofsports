import { notFound } from "next/navigation";

import CustomerPurchaseHistory from "@/components/admin/growth/customer-360/CustomerPurchaseHistory";
import CustomerTimeline from "@/components/admin/growth/customer-360/CustomerTimeline";
import ActivityComposer from "@/components/admin/growth/lead-workspace/ActivityComposer";
import LeadHeader from "@/components/admin/growth/lead-workspace/LeadHeader";
import LeadInsights from "@/components/admin/growth/lead-workspace/LeadInsights";
import LeadIntelligenceCards from "@/components/admin/growth/lead-workspace/LeadIntelligenceCards";
import LeadProfileCard from "@/components/admin/growth/lead-workspace/LeadProfileCard";

import { getCustomer360 } from "@/lib/growth/customer360";

type GrowthLeadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GrowthLeadPage({
  params,
}: GrowthLeadPageProps) {
  const { id } = await params;

  const customer = await getCustomer360(id);

  if (!customer) {
    notFound();
  }

  const { lead, activities } = customer;

  return (
    <div className="space-y-6">
      <LeadHeader customer={customer} />

      <LeadIntelligenceCards
        lead={lead}
        activities={activities}
        revenue={customer.revenue}
        membership={customer.membership}
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <LeadProfileCard customer={customer} />

        <main className="space-y-5">
          <ActivityComposer leadId={lead.id} />

          <CustomerPurchaseHistory
            orders={customer.orders}
          />

          <CustomerTimeline customer={customer} />
        </main>

        <LeadInsights customer={customer} />
      </div>
    </div>
  );
}
