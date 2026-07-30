import { createClient } from "@/lib/supabase/server";

export type GrowthLead = {
  id: string;
  profileId: string | null;
  displayName: string;
  username: string | null;
  platform: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  location: string | null;
  status: string;
  leadScore: number;
  source: string | null;
  sourceDetail: string | null;
  favoriteSports: string[];
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  ownerId: string | null;
  convertedAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type GrowthLeadRow = {
  id: string;
  profile_id: string | null;
  name: string | null;
  username: string | null;
  platform: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  location: string | null;
  status: string | null;
  lead_score: number | null;
  source: string | null;
  source_detail: string | null;
  favorite_sports: string[] | null;
  notes: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  owner_id: string | null;
  converted_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export async function getGrowthLead(
  id: string,
): Promise<GrowthLead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("growth_leads")
    .select(`
      id,
      profile_id,
      name,
      username,
      platform,
      profile_url,
      avatar_url,
      location,
      status,
      lead_score,
      source,
      source_detail,
      favorite_sports,
      notes,
      last_contact_at,
      next_follow_up_at,
      owner_id,
      converted_at,
      lost_at,
      lost_reason,
      metadata,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load growth lead:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const lead = data as GrowthLeadRow;

  return {
    id: lead.id,
    profileId: lead.profile_id,
    displayName: lead.name || lead.username || "Unnamed Lead",
    username: lead.username,
    platform: lead.platform,
    profileUrl: lead.profile_url,
    avatarUrl: lead.avatar_url,
    location: lead.location,
    status: lead.status ?? "new",
    leadScore: lead.lead_score ?? 0,
    source: lead.source,
    sourceDetail: lead.source_detail,
    favoriteSports: lead.favorite_sports ?? [],
    notes: lead.notes,
    lastContactAt: lead.last_contact_at,
    nextFollowUpAt: lead.next_follow_up_at,
    ownerId: lead.owner_id,
    convertedAt: lead.converted_at,
    lostAt: lead.lost_at,
    lostReason: lead.lost_reason,
    metadata: lead.metadata ?? {},
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}