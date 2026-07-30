import AddLeadForm from "@/components/admin/growth/leads/AddLeadForm";
import LeadTable from "@/components/admin/growth/leads/LeadTable";
import GrowthHeader from "@/components/admin/growth/GrowthHeader";
import { getGrowthLeads } from "@/lib/growth/leads";
import LeadIntelligenceCards from "@/components/admin/growth/lead-workspace/LeadIntelligenceCards";

export default async function GrowthLeadsPage() {
  const leads = await getGrowthLeads();

  const hotLeads = leads.filter(
    (lead) => lead.priorityLevel === "hot",
  ).length;

  const warmLeads = leads.filter(
    (lead) => lead.priorityLevel === "warm",
  ).length;

  const overdueLeads = leads.filter(
    (lead) => lead.followUpUrgency === "overdue",
  ).length;

  return (
    <>
      <GrowthHeader
        eyebrow="Lead Management"
        title="Leads"
        description="Capture prospects, track their relationship with KofSports, and move each person toward a trial or premium membership."
        action={
          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            {leads.length}{" "}
            {leads.length === 1 ? "Lead" : "Leads"}
          </div>
        }
      />

      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AddLeadForm />

        <section className="min-w-0">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
              Lead Inbox
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Prioritized Leads
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Prospects are ranked by engagement, follow-up
              urgency, activity, and lifecycle status.
            </p>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-red-600">
                Hot Leads
              </p>

              <p className="mt-2 text-2xl font-black text-red-950">
                {hotLeads}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                Warm Leads
              </p>

              <p className="mt-2 text-2xl font-black text-amber-950">
                {warmLeads}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Overdue
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {overdueLeads}
              </p>
            </div>
          </div>

          <LeadTable leads={leads} />
        </section>
      </div>
    </>
  );
}
