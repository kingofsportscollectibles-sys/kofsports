import { createClient } from "@/lib/supabase/server";

export type GrowthActivity = {
  id: string;
  leadId: string;
  activityType: string;
  platform: string | null;
  direction: string | null;
  title: string | null;
  description: string | null;
  occurredAt: string;
};

type GrowthActivityRow = {
  id: string;
  lead_id: string;
  activity_type: string;
  platform: string | null;
  direction: string | null;
  title: string | null;
  description: string | null;
  occurred_at: string;
};

export async function getLeadActivities(
  leadId: string,
): Promise<GrowthActivity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("growth_activities")
    .select(`
      id,
      lead_id,
      activity_type,
      platform,
      direction,
      title,
      description,
      occurred_at
    `)
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error(error.message);
    return [];
  }

  return ((data ?? []) as GrowthActivityRow[]).map((activity) => ({
    id: activity.id,
    leadId: activity.lead_id,
    activityType: activity.activity_type,
    platform: activity.platform,
    direction: activity.direction,
    title: activity.title,
    description: activity.description,
    occurredAt: activity.occurred_at,
  }));
}