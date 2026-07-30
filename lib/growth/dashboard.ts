import { createClient } from "@/lib/supabase/server";

export type GrowthFunnel = {
  discovered: number;
  conversation: number;
  interested: number;
  trial: number;
  premium: number;
};

export type DashboardLead = {
  id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  status: string;
  score: number;
  createdAt: string;
};

export type DashboardFollowUp = {
  id: string;
  leadId: string;
  title: string;
  dueAt: string;
  status: "overdue" | "due_today" | "upcoming";
  leadName: string | null;
  handle: string | null;
  platform: string | null;
};

export type DashboardActivity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
  leadName: string | null;
};

type UnknownRow = Record<string, unknown>;

function readString(
  row: UnknownRow,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readNumber(
  row: UnknownRow,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function getLeadName(row: UnknownRow): string | null {
  const directName = readString(row, [
    "lead_name",
    "contact_name",
    "display_name",
    "name",
  ]);

  if (directName) {
    return directName;
  }

  const relatedLead = row.growth_leads;

  if (
    relatedLead &&
    typeof relatedLead === "object" &&
    !Array.isArray(relatedLead)
  ) {
    const lead = relatedLead as UnknownRow;

    return (
      readString(lead, [
        "name",
        "display_name",
        "full_name",
        "username",
        "handle",
      ]) || null
    );
  }

  return null;
}

function getDayBoundaries() {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  return {
    now,
    startOfToday,
    endOfToday,
    startOfTodayIso: startOfToday.toISOString(),
    endOfTodayIso: endOfToday.toISOString(),
  };
}

function getFollowUpStatus(
  dueAt: string,
  startOfToday: Date,
  endOfToday: Date,
): DashboardFollowUp["status"] {
  const dueDate = new Date(dueAt);

  if (dueDate.getTime() < startOfToday.getTime()) {
    return "overdue";
  }

  if (dueDate.getTime() <= endOfToday.getTime()) {
    return "due_today";
  }

  return "upcoming";
}

function normalizeLead(row: UnknownRow): DashboardLead {
  const handle =
    readString(row, ["username", "handle", "platform_username"]) || null;

  return {
    id: readString(row, ["id"]),
    name:
      readString(row, [
        "name",
        "display_name",
        "full_name",
        "contact_name",
      ]) ||
      handle ||
      "Unnamed lead",
    handle,
    platform:
      readString(row, [
        "platform",
        "primary_platform",
        "source_platform",
      ]) || null,
    status: readString(row, ["status", "lifecycle_stage"], "new"),
    score: readNumber(row, ["lead_score", "score"], 0),
    createdAt: readString(
      row,
      ["created_at"],
      new Date().toISOString(),
    ),
  };
}

function normalizeFollowUp(
  row: UnknownRow,
  startOfToday: Date,
  endOfToday: Date,
): DashboardFollowUp {
  const dueAt = readString(
    row,
    ["next_follow_up_at"],
    new Date().toISOString(),
  );

  const handle =
    readString(row, ["username", "handle", "platform_username"]) || null;

  const leadName =
    readString(row, [
      "name",
      "display_name",
      "full_name",
      "contact_name",
    ]) ||
    handle ||
    "Unnamed lead";

  return {
    id: readString(row, ["id"]),
    leadId: readString(row, ["id"]),
    title: "Follow up with lead",
    dueAt,
    status: getFollowUpStatus(
      dueAt,
      startOfToday,
      endOfToday,
    ),
    leadName,
    handle,
    platform:
      readString(row, [
        "platform",
        "primary_platform",
        "source_platform",
      ]) || null,
  };
}

function normalizeActivity(row: UnknownRow): DashboardActivity {
  const type = readString(
    row,
    ["activity_type", "type", "channel"],
    "activity",
  );

  return {
    id: readString(row, ["id"]),
    type,
    title: readString(
      row,
      ["title", "subject", "summary"],
      type.replaceAll("_", " "),
    ),
    description:
      readString(row, [
        "description",
        "body",
        "notes",
        "content",
      ]) || null,
    occurredAt: readString(
      row,
      ["occurred_at", "created_at"],
      new Date().toISOString(),
    ),
    leadName: getLeadName(row),
  };
}

export async function getGrowthDashboard() {
  const supabase = await createClient();

  const {
    startOfToday,
    endOfToday,
    startOfTodayIso,
    endOfTodayIso,
  } = getDayBoundaries();

  const [
    newLeadCountResult,
    conversationsResult,
    followUpCountResult,
    overdueCountResult,
    premiumResult,
    stageResult,
    recentActivityResult,
    recentLeadsResult,
    dueFollowUpsResult,
  ] = await Promise.all([
    supabase
      .from("growth_leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfTodayIso),

    supabase
      .from("growth_activities")
      .select("activity_type")
      .gte("occurred_at", startOfTodayIso),

    supabase
      .from("growth_leads")
      .select("id", { count: "exact", head: true })
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", endOfTodayIso),

    supabase
      .from("growth_leads")
      .select("id", { count: "exact", head: true })
      .not("next_follow_up_at", "is", null)
      .lt("next_follow_up_at", startOfTodayIso),

    supabase
      .from("growth_leads")
      .select("id", { count: "exact", head: true })
      .in("status", ["premium", "member", "renewed"]),

    supabase
      .from("growth_leads")
      .select("status"),

    supabase
      .from("growth_activities")
      .select(`
        id,
        activity_type,
        title,
        description,
        occurred_at,
        growth_leads (
          id,
          name,
          username
        )
      `)
      .order("occurred_at", { ascending: false })
      .limit(10),

    supabase
      .from("growth_leads")
      .select(`
        id,
        name,
        username,
        platform,
        status,
        lead_score,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("growth_leads")
      .select(`
        id,
        name,
        username,
        platform,
        next_follow_up_at
      `)
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", endOfTodayIso)
      .order("next_follow_up_at", { ascending: true })
      .limit(10),
  ]);

  const errors = [
    newLeadCountResult.error,
    conversationsResult.error,
    followUpCountResult.error,
    overdueCountResult.error,
    premiumResult.error,
    stageResult.error,
    recentActivityResult.error,
    recentLeadsResult.error,
    dueFollowUpsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error(
      "Growth dashboard query errors:",
      errors.map((error) => error?.message),
    );
  }

  const funnel: GrowthFunnel = {
    discovered: 0,
    conversation: 0,
    interested: 0,
    trial: 0,
    premium: 0,
  };

  for (const lead of stageResult.data ?? []) {
    const status = lead.status?.toLowerCase();

    switch (status) {
      case "new":
      case "discovered":
      case "contacted":
        funnel.discovered += 1;
        break;

      case "conversation":
      case "conversation_started":
      case "engaged":
        funnel.conversation += 1;
        break;

      case "interested":
      case "qualified":
      case "website_visitor":
        funnel.interested += 1;
        break;

      case "trial":
      case "free_trial":
        funnel.trial += 1;
        break;

      case "premium":
      case "member":
      case "renewed":
        funnel.premium += 1;
        break;
    }
  }

  const conversationTypes = new Set([
    "conversation",
    "conversation_started",
    "dm",
    "dm_sent",
    "dm_received",
    "direct_message",
    "reply",
    "tweet_reply",
    "comment_reply",
    "email",
  ]);

  const conversationsStarted = (
    conversationsResult.data ?? []
  ).filter((activity) =>
    conversationTypes.has(
      readString(
        activity as UnknownRow,
        ["activity_type", "type"],
      ).toLowerCase(),
    ),
  ).length;

  return {
    stats: {
      newLeads: newLeadCountResult.count ?? 0,
      conversations: conversationsStarted,
      followups: followUpCountResult.count ?? 0,
      overdue: overdueCountResult.count ?? 0,
      premium: premiumResult.count ?? 0,
    },

    funnel,

    recentActivity: (recentActivityResult.data ?? []).map((row) =>
      normalizeActivity(row as UnknownRow),
    ),

    newLeads: (recentLeadsResult.data ?? []).map((row) =>
      normalizeLead(row as UnknownRow),
    ),

    followups: (dueFollowUpsResult.data ?? []).map((row) =>
      normalizeFollowUp(
        row as UnknownRow,
        startOfToday,
        endOfToday,
      ),
    ),
  };
}
