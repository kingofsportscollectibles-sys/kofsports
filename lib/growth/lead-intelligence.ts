import type { GrowthActivity } from "@/lib/growth/activity";
import type { GrowthLead } from "@/lib/growth/lead";

export type BuyingIntentLevel = "high" | "medium" | "low";

export type LeadIntelligence = {
  buyingIntent: BuyingIntentLevel;
  intentScore: number;
  intentReasons: string[];
  recommendedAction: string;
  recommendationReason: string;
  suggestedMessage: string;
  confidence: number;
};

const HIGH_INTENT_ACTIVITY_TYPES = [
  "interested",
  "trial",
  "premium_signup",
  "pricing_view",
  "premium_view",
  "website_visit",
];

const CONVERSATION_ACTIVITY_TYPES = [
  "dm",
  "message",
  "reply",
  "email",
  "tweet_reply",
  "instagram_dm",
];

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase().replaceAll(" ", "_") ?? "";
}

function getActivityTimestamp(activity: GrowthActivity) {
  const timestamp = new Date(activity.occurredAt).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function happenedWithinDays(
  activity: GrowthActivity,
  days: number,
) {
  const timestamp = getActivityTimestamp(activity);

  if (timestamp === null) {
    return false;
  }

  return (
    timestamp >=
    Date.now() - days * 24 * 60 * 60 * 1000
  );
}

function isInbound(activity: GrowthActivity) {
  return normalizeValue(activity.direction) === "inbound";
}

function isOutbound(activity: GrowthActivity) {
  return normalizeValue(activity.direction) === "outbound";
}

function includesActivityType(
  activity: GrowthActivity,
  activityTypes: string[],
) {
  return activityTypes.includes(
    normalizeValue(activity.activityType),
  );
}

function hasIntentLanguage(activity: GrowthActivity) {
  const content = [
    activity.title,
    activity.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const intentTerms = [
    "interested",
    "premium",
    "trial",
    "price",
    "pricing",
    "cost",
    "how much",
    "sign up",
    "subscribe",
    "membership",
    "join",
    "included",
  ];

  return intentTerms.some((term) =>
    content.includes(term),
  );
}

function getDaysSinceLastContact(
  lastContactAt: string | null,
) {
  if (!lastContactAt) {
    return null;
  }

  const timestamp = new Date(lastContactAt).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / 86_400_000,
    ),
  );
}

function getIntentLevel(
  score: number,
): BuyingIntentLevel {
  if (score >= 65) {
    return "high";
  }

  if (score >= 30) {
    return "medium";
  }

  return "low";
}

function buildRecommendation({
  lead,
  activities,
  buyingIntent,
  recentInbound,
  inboundCount,
  daysSinceLastContact,
}: {
  lead: GrowthLead;
  activities: GrowthActivity[];
  buyingIntent: BuyingIntentLevel;
  recentInbound: boolean;
  inboundCount: number;
  daysSinceLastContact: number | null;
}) {
  const status = normalizeValue(lead.status);

  if (
    ["premium", "member", "renewed"].includes(status)
  ) {
    return {
      action: "Focus on retention",
      reason:
        "This lead is already a customer, so the next step should strengthen the relationship rather than push another sale.",
      message:
        "Check in, share a useful update, and ask how their KofSports experience has been so far.",
    };
  }

  if (
    ["trial", "free_trial"].includes(status)
  ) {
    return {
      action: "Follow up on the trial",
      reason:
        "The lead has already crossed the biggest conversion barrier by starting a trial.",
      message:
        "Ask how the trial is going, highlight recent results, and explain the clearest reason to continue with Premium.",
    };
  }

  if (recentInbound) {
    return {
      action: "Reply while momentum is high",
      reason:
        "The lead sent an inbound message recently, making this the best time to continue the conversation.",
      message:
        "Respond personally to their latest message, answer their question, and offer one clear next step.",
    };
  }

  if (
    lead.nextFollowUpAt &&
    new Date(lead.nextFollowUpAt).getTime() <
      Date.now()
  ) {
    return {
      action: "Complete the overdue follow-up",
      reason:
        "A scheduled follow-up is overdue and should be addressed before starting new outreach.",
      message:
        "Send a brief, low-pressure follow-up that references the prior conversation and offers something useful.",
    };
  }

  if (buyingIntent === "high") {
    return {
      action: "Offer a Premium trial",
      reason:
        "The lead is showing multiple buying signals and appears ready for a direct conversion opportunity.",
      message:
        "Offer a simple Premium trial or short-term option tied to the sport or market they care about most.",
    };
  }

  if (buyingIntent === "medium") {
    return {
      action: "Build trust with value",
      reason:
        "The lead is engaged, but there is not yet enough evidence for a direct sales push.",
      message:
        "Share a relevant free pick, result, article, or insight and ask an easy conversational question.",
    };
  }

  if (
    inboundCount === 0 &&
    activities.length > 0
  ) {
    return {
      action: "Change the outreach angle",
      reason:
        "Previous outreach has not generated an inbound response.",
      message:
        "Avoid another generic sales message. Engage with their content or reference a specific sport, bet, or recent post.",
    };
  }

  if (
    daysSinceLastContact !== null &&
    daysSinceLastContact >= 14
  ) {
    return {
      action: "Re-engage the lead",
      reason:
        "The relationship has been inactive for at least two weeks.",
      message:
        "Restart the conversation with timely value rather than mentioning that they never replied.",
    };
  }

  return {
    action: "Start a conversation",
    reason:
      "The lead does not yet have enough engagement history to justify a stronger sales action.",
    message:
      "Engage naturally around a recent sports topic or post and focus on earning the first reply.",
  };
}

export function getLeadIntelligence(
  lead: GrowthLead,
  activities: GrowthActivity[],
): LeadIntelligence {
  let intentScore = Math.min(
    Math.max(lead.leadScore, 0),
    50,
  );

  const reasons: string[] = [];

  const inboundActivities = activities.filter(isInbound);
  const outboundActivities = activities.filter(isOutbound);

  const recentInboundActivities =
    inboundActivities.filter((activity) =>
      happenedWithinDays(activity, 7),
    );

  const recentActivities = activities.filter(
    (activity) => happenedWithinDays(activity, 7),
  );

  const highIntentActivities = activities.filter(
    (activity) =>
      includesActivityType(
        activity,
        HIGH_INTENT_ACTIVITY_TYPES,
      ) || hasIntentLanguage(activity),
  );

  const conversationActivities = activities.filter(
    (activity) =>
      includesActivityType(
        activity,
        CONVERSATION_ACTIVITY_TYPES,
      ),
  );

  const status = normalizeValue(lead.status);

  if (
    ["interested", "qualified"].includes(status)
  ) {
    intentScore += 20;
    reasons.push(
      `Lead status is ${status.replaceAll("_", " ")}.`,
    );
  }

  if (
    ["trial", "free_trial"].includes(status)
  ) {
    intentScore += 30;
    reasons.push("The lead has started a trial.");
  }

  if (
    ["premium", "member", "renewed"].includes(status)
  ) {
    intentScore = 100;
    reasons.push(
      "The lead has already converted into a customer.",
    );
  }

  if (recentInboundActivities.length > 0) {
    intentScore += 20;
    reasons.push(
      `${recentInboundActivities.length} inbound ${
        recentInboundActivities.length === 1
          ? "response"
          : "responses"
      } in the last 7 days.`,
    );
  } else if (inboundActivities.length > 0) {
    intentScore += 10;
    reasons.push(
      `${inboundActivities.length} total inbound ${
        inboundActivities.length === 1
          ? "response"
          : "responses"
      }.`,
    );
  }

  if (highIntentActivities.length > 0) {
    intentScore += Math.min(
      highIntentActivities.length * 8,
      24,
    );

    reasons.push(
      `${highIntentActivities.length} buying-intent ${
        highIntentActivities.length === 1
          ? "signal"
          : "signals"
      } logged.`,
    );
  }

  if (recentActivities.length >= 3) {
    intentScore += 10;
    reasons.push(
      "The lead has strong recent activity momentum.",
    );
  }

  if (
    conversationActivities.length > 0 &&
    inboundActivities.length > 0
  ) {
    intentScore += 5;
    reasons.push(
      "The relationship has developed into a two-way conversation.",
    );
  }

  if (
    outboundActivities.length >= 3 &&
    inboundActivities.length === 0
  ) {
    intentScore -= 15;
    reasons.push(
      "Multiple outbound touches have not received a reply.",
    );
  }

  const daysSinceLastContact =
    getDaysSinceLastContact(lead.lastContactAt);

  if (
    daysSinceLastContact !== null &&
    daysSinceLastContact >= 14
  ) {
    intentScore -= 15;
    reasons.push(
      `No contact has been logged in ${daysSinceLastContact} days.`,
    );
  }

  intentScore = Math.min(
    Math.max(Math.round(intentScore), 0),
    100,
  );

  const buyingIntent = getIntentLevel(intentScore);

  const recommendation = buildRecommendation({
    lead,
    activities,
    buyingIntent,
    recentInbound: recentInboundActivities.length > 0,
    inboundCount: inboundActivities.length,
    daysSinceLastContact,
  });

  const confidence = Math.min(
    95,
    Math.max(
      45,
      45 +
        Math.min(activities.length * 4, 32) +
        (lead.lastContactAt ? 5 : 0) +
        (lead.nextFollowUpAt ? 5 : 0),
    ),
  );

  return {
    buyingIntent,
    intentScore,
    intentReasons:
      reasons.length > 0
        ? reasons.slice(0, 4)
        : [
            "There is not yet enough activity history to identify strong buying signals.",
          ],
    recommendedAction: recommendation.action,
    recommendationReason: recommendation.reason,
    suggestedMessage: recommendation.message,
    confidence,
  };
}