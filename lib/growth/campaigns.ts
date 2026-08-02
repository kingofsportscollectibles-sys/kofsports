import { createAdminClient } from "@/lib/supabase/admin";

export type GrowthCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "canceled";

export type GrowthCampaignListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: GrowthCampaignStatus;
  platform: string | null;
  campaignType: string | null;
  startsAt: string | null;
  endsAt: string | null;
  budgetCents: number;
  targetLeadCount: number;
  audienceDescription: string | null;
  goalType: string | null;
  goalValue: number | null;
  totalMembers: number;
  contactedCount: number;
  repliedCount: number;
  interestedCount: number;
  convertedCount: number;
  revenueAttributed: number;
  createdAt: string;
};

export type CampaignDashboardSummary = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMembers: number;
  contactedCount: number;
  repliedCount: number;
  convertedCount: number;
  attributedRevenue: number;
  replyRate: number;
  conversionRate: number;
};

export type CampaignDashboardData = {
  campaigns: GrowthCampaignListItem[];
  summary: CampaignDashboardSummary;
};

type CampaignMemberRow = {
  status: string;
  revenue_attributed: number | string | null;
};

type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: GrowthCampaignStatus;
  platform: string | null;
  campaign_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  budget_cents: number | null;
  target_lead_count: number | null;
  audience_description: string | null;
  goal_type: string | null;
  goal_value: number | string | null;
  created_at: string;
  growth_campaign_members: CampaignMemberRow[] | null;
};

export type CampaignMember = {
  leadId: string;
  displayName: string;
  username: string | null;
  platform: string | null;
  leadStatus: string;
  leadScore: number;
  campaignStatus: string;
  joinedAt: string;
  contactedAt: string | null;
  repliedAt: string | null;
  convertedAt: string | null;
  revenueAttributed: number;
  notes: string | null;
};

export type GrowthCampaignDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: GrowthCampaignStatus;
  platform: string | null;
  campaignType: string | null;
  startsAt: string | null;
  endsAt: string | null;
  budgetCents: number;
  goalType: string | null;
  goalValue: number | null;
  audienceDescription: string | null;
  messageTemplate: string | null;
  targetLeadCount: number;
  createdAt: string;
  members: CampaignMember[];
  contactedCount: number;
  repliedCount: number;
  interestedCount: number;
  convertedCount: number;
  revenueAttributed: number;
};

function toNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCampaignDashboard(): Promise<CampaignDashboardData> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("growth_campaigns")
    .select(`
      id,
      name,
      slug,
      description,
      status,
      platform,
      campaign_type,
      starts_at,
      ends_at,
      budget_cents,
      target_lead_count,
      audience_description,
      goal_type,
      goal_value,
      created_at,
      growth_campaign_members (
        status,
        revenue_attributed
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load Growth OS campaigns:",
      error,
    );

    throw new Error("Unable to load campaigns.");
  }

  const campaigns = ((data ?? []) as CampaignRow[]).map(
    (campaign) => {
      const members =
        campaign.growth_campaign_members ?? [];

      const totalMembers = members.length;

      const contactedCount = members.filter((member) =>
        [
          "contacted",
          "replied",
          "interested",
          "converted",
          "unresponsive",
          "opted_out",
        ].includes(member.status),
      ).length;

      const repliedCount = members.filter((member) =>
        [
          "replied",
          "interested",
          "converted",
        ].includes(member.status),
      ).length;

      const interestedCount = members.filter((member) =>
        ["interested", "converted"].includes(
          member.status,
        ),
      ).length;

      const convertedCount = members.filter(
        (member) => member.status === "converted",
      ).length;

      const revenueAttributed = members.reduce(
        (total, member) =>
          total +
          toNumber(member.revenue_attributed),
        0,
      );

      return {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        status: campaign.status,
        platform: campaign.platform,
        campaignType: campaign.campaign_type,
        startsAt: campaign.starts_at,
        endsAt: campaign.ends_at,
        budgetCents: campaign.budget_cents ?? 0,
        targetLeadCount:
          campaign.target_lead_count ?? 0,
        audienceDescription:
          campaign.audience_description,
        goalType: campaign.goal_type,
        goalValue:
          campaign.goal_value !== null
            ? toNumber(campaign.goal_value)
            : null,
        totalMembers,
        contactedCount,
        repliedCount,
        interestedCount,
        convertedCount,
        revenueAttributed,
        createdAt: campaign.created_at,
      };
    },
  );

  const totalMembers = campaigns.reduce(
    (total, campaign) =>
      total + campaign.totalMembers,
    0,
  );

  const contactedCount = campaigns.reduce(
    (total, campaign) =>
      total + campaign.contactedCount,
    0,
  );

  const repliedCount = campaigns.reduce(
    (total, campaign) =>
      total + campaign.repliedCount,
    0,
  );

  const convertedCount = campaigns.reduce(
    (total, campaign) =>
      total + campaign.convertedCount,
    0,
  );

  const attributedRevenue = campaigns.reduce(
    (total, campaign) =>
      total + campaign.revenueAttributed,
    0,
  );

  return {
    campaigns,
    summary: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(
        (campaign) => campaign.status === "active",
      ).length,
      totalMembers,
      contactedCount,
      repliedCount,
      convertedCount,
      attributedRevenue,
      replyRate:
        contactedCount > 0
          ? (repliedCount / contactedCount) * 100
          : 0,
      conversionRate:
        contactedCount > 0
          ? (convertedCount / contactedCount) *
            100
          : 0,
    },
  };
  }

  export async function getCampaignDetail(
  campaignId: string,
): Promise<GrowthCampaignDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("growth_campaigns")
    .select(`
      id,
      name,
      slug,
      description,
      status,
      platform,
      campaign_type,
      starts_at,
      ends_at,
      budget_cents,
      goal_type,
      goal_value,
      audience_description,
      message_template,
      target_lead_count,
      created_at,
      growth_campaign_members (
        lead_id,
        status,
        joined_at,
        contacted_at,
        replied_at,
        converted_at,
        revenue_attributed,
        notes,
        growth_leads (
          name,
          username,
          platform,
          status,
          lead_score
        )
      )
    `)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load campaign detail:",
      error,
    );

    throw new Error("Unable to load campaign.");
  }

  if (!data) {
    return null;
  }

  const rawMembers = Array.isArray(
    data.growth_campaign_members,
  )
    ? data.growth_campaign_members
    : [];

  const members: CampaignMember[] = rawMembers.map(
    (member) => {
      const lead = Array.isArray(member.growth_leads)
        ? member.growth_leads[0]
        : member.growth_leads;

      return {
        leadId: member.lead_id,
        displayName:
          lead?.name ||
          lead?.username ||
          "Unnamed Lead",
        username: lead?.username ?? null,
        platform: lead?.platform ?? null,
        leadStatus: lead?.status ?? "new",
        leadScore: lead?.lead_score ?? 0,
        campaignStatus: member.status,
        joinedAt: member.joined_at,
        contactedAt: member.contacted_at,
        repliedAt: member.replied_at,
        convertedAt: member.converted_at,
        revenueAttributed: toNumber(
          member.revenue_attributed,
        ),
        notes: member.notes,
      };
    },
  );

  const contactedStatuses = new Set([
    "contacted",
    "replied",
    "interested",
    "converted",
    "unresponsive",
    "opted_out",
  ]);

  const contactedCount = members.filter((member) =>
    contactedStatuses.has(member.campaignStatus),
  ).length;

  const repliedCount = members.filter((member) =>
    ["replied", "interested", "converted"].includes(
      member.campaignStatus,
    ),
  ).length;

  const interestedCount = members.filter((member) =>
    ["interested", "converted"].includes(
      member.campaignStatus,
    ),
  ).length;

  const convertedCount = members.filter(
    (member) => member.campaignStatus === "converted",
  ).length;

  const revenueAttributed = members.reduce(
    (total, member) =>
      total + member.revenueAttributed,
    0,
  );

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    status: data.status,
    platform: data.platform,
    campaignType: data.campaign_type,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    budgetCents: data.budget_cents ?? 0,
    goalType: data.goal_type,
    goalValue:
      data.goal_value !== null
        ? toNumber(data.goal_value)
        : null,
    audienceDescription:
      data.audience_description,
    messageTemplate: data.message_template,
    targetLeadCount: data.target_lead_count ?? 0,
    createdAt: data.created_at,
    members,
    contactedCount,
    repliedCount,
    interestedCount,
    convertedCount,
    revenueAttributed,
  };
}