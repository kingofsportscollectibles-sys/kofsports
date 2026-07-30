import { createClient } from "@/lib/supabase/server";

export type LeadPriorityLevel =
  | "hot"
  | "warm"
  | "active"
  | "cold"
  | "customer";

export type FollowUpUrgency =
  | "overdue"
  | "today"
  | "upcoming"
  | "none";

export type GrowthLeadListItem = {
  id: string;
  displayName: string;
  username: string | null;
  platform: string;
  status: string;
  source: string | null;
  score: number;
  priorityScore: number;
  priorityLevel: LeadPriorityLevel;
  followUpUrgency: FollowUpUrgency;
  notes: string | null;
  profileUrl: string | null;
  favoriteSports: string[];
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  hasRecentInboundActivity: boolean;
};

type GrowthLeadRow = {
  id: string;
  name: string | null;
  username: string | null;
  platform: string;
  status: string;
  source: string | null;
  lead_score: number | string | null;
  notes: string | null;
  profile_url: string | null;
  favorite_sports: string[] | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
};

type RecentInboundActivityRow = {
  lead_id: string;
};

function getStartOfToday(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getEndOfToday(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

function getFollowUpUrgency(
  nextFollowUpAt: string | null,
): FollowUpUrgency {
  if (!nextFollowUpAt) {
    return "none";
  }

  const followUpDate = new Date(nextFollowUpAt);

  if (Number.isNaN(followUpDate.getTime())) {
    return "none";
  }

  const startOfToday = getStartOfToday();
  const endOfToday = getEndOfToday();

  if (followUpDate.getTime() < startOfToday.getTime()) {
    return "overdue";
  }

  if (followUpDate.getTime() <= endOfToday.getTime()) {
    return "today";
  }

  return "upcoming";
}

function isCustomerStatus(status: string): boolean {
  return ["premium", "member", "renewed"].includes(
    status.toLowerCase(),
  );
}

function calculatePriorityScore({
  leadScore,
  status,
  lastContactAt,
  followUpUrgency,
  hasRecentInboundActivity,
}: {
  leadScore: number;
  status: string;
  lastContactAt: string | null;
  followUpUrgency: FollowUpUrgency;
  hasRecentInboundActivity: boolean;
}): number {
  if (isCustomerStatus(status)) {
    return 0;
  }

  let priorityScore = leadScore;

  if (followUpUrgency === "overdue") {
    priorityScore += 30;
  }

  if (followUpUrgency === "today") {
    priorityScore += 15;
  }

  if (hasRecentInboundActivity) {
    priorityScore += 25;
  }

  if (["trial", "free_trial"].includes(status.toLowerCase())) {
    priorityScore += 20;
  }

  if (lastContactAt) {
    const lastContactDate = new Date(lastContactAt);

    if (!Number.isNaN(lastContactDate.getTime())) {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      if (lastContactDate.getTime() < fourteenDaysAgo.getTime()) {
        priorityScore -= 20;
      }
    }
  }

  return Math.max(priorityScore, 0);
}

function getPriorityLevel(
  priorityScore: number,
  status: string,
): LeadPriorityLevel {
  if (isCustomerStatus(status)) {
    return "customer";
  }

  if (priorityScore >= 90) {
    return "hot";
  }

  if (priorityScore >= 50) {
    return "warm";
  }

  if (priorityScore >= 20) {
    return "active";
  }

  return "cold";
}

function parseLeadScore(value: number | string | null): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getGrowthLeads(): Promise<
  GrowthLeadListItem[]
> {
  const supabase = await createClient();

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(
    twentyFourHoursAgo.getHours() - 24,
  );

  const [leadsResult, inboundActivityResult] =
    await Promise.all([
      supabase
        .from("growth_leads")
        .select(
          `
            id,
            name,
            username,
            platform,
            status,
            source,
            lead_score,
            notes,
            profile_url,
            favorite_sports,
            last_contact_at,
            next_follow_up_at,
            created_at
          `,
        )
        .limit(100),

      supabase
        .from("growth_activities")
        .select("lead_id")
        .eq("direction", "inbound")
        .gte(
          "occurred_at",
          twentyFourHoursAgo.toISOString(),
        ),
    ]);

  if (leadsResult.error) {
    console.error(
      "Unable to load Growth OS leads:",
      leadsResult.error.message,
    );

    return [];
  }

  if (inboundActivityResult.error) {
    console.error(
      "Unable to load recent inbound lead activity:",
      inboundActivityResult.error.message,
    );
  }

  const recentInboundLeadIds = new Set(
    (
      (inboundActivityResult.data ?? []) as RecentInboundActivityRow[]
    ).map((activity) => activity.lead_id),
  );

  const leads = (
    (leadsResult.data ?? []) as GrowthLeadRow[]
  ).map((lead) => {
    const score = parseLeadScore(lead.lead_score);

    const followUpUrgency = getFollowUpUrgency(
      lead.next_follow_up_at,
    );

    const hasRecentInboundActivity =
      recentInboundLeadIds.has(lead.id);

    const priorityScore = calculatePriorityScore({
      leadScore: score,
      status: lead.status,
      lastContactAt: lead.last_contact_at,
      followUpUrgency,
      hasRecentInboundActivity,
    });

    const priorityLevel = getPriorityLevel(
      priorityScore,
      lead.status,
    );

    return {
      id: lead.id,
      displayName:
        lead.name || lead.username || "Unnamed lead",
      username: lead.username,
      platform: lead.platform,
      status: lead.status,
      source: lead.source,
      score,
      priorityScore,
      priorityLevel,
      followUpUrgency,
      notes: lead.notes,
      profileUrl: lead.profile_url,
      favoriteSports: lead.favorite_sports ?? [],
      lastContactAt: lead.last_contact_at,
      nextFollowUpAt: lead.next_follow_up_at,
      createdAt: lead.created_at,
      hasRecentInboundActivity,
    };
  });

  return leads.sort((firstLead, secondLead) => {
    const firstIsCustomer =
      firstLead.priorityLevel === "customer";

    const secondIsCustomer =
      secondLead.priorityLevel === "customer";

    if (firstIsCustomer !== secondIsCustomer) {
      return firstIsCustomer ? 1 : -1;
    }

    if (
      secondLead.priorityScore !==
      firstLead.priorityScore
    ) {
      return (
        secondLead.priorityScore -
        firstLead.priorityScore
      );
    }

    return (
      new Date(secondLead.createdAt).getTime() -
      new Date(firstLead.createdAt).getTime()
    );
  });
}
