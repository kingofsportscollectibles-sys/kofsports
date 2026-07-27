import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient as createServerClient } from "@/lib/supabase/server";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  trend?: string;
};

export type RecentSignup = {
  id: string;
  name: string;
  plan: string;
  joinedAt: string;
  expiresAt: string | null;
  amountInCents: number;
};

export type TopSport = {
  sport: string;
  units: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  picks: number;
};

export type RevenuePoint = {
  label: string;
  amountInCents: number;
};

export type MemberGrowthPoint = {
  label: string;
  members: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "membership" | "pick" | "result";
};

export type FunnelStage = {
  label: string;
  value: number | null;
  note?: string;
};

export type NotificationHealth = {
  emailConfigured: boolean;
  smsConfigured: boolean;
  emailProvider: string;
  smsProvider: string;
};

export type SystemHealthItem = {
  name: string;
  status: "healthy" | "warning";
  description: string;
};

export type PriorityItem = {
  id: string;
  severity: "high" | "medium" | "positive";
  title: string;
  description: string;
  href?: string;
};

export type AdminDashboardData = {
  adminName: string;
  activePremiumMembers: number;
  newPremiumMembersThisMonth: number;
  mrrInCents: number;
  currentMonthRevenueInCents: number;
  previousMonthRevenueInCents: number;
  revenueChangePercent: number | null;
  renewalRate: number | null;
  churnRate: number | null;
  accountToPremiumConversion: number | null;
  totalAccounts: number;
  recentSignups: RecentSignup[];
  topSports: TopSport[];
  revenueByMonth: RevenuePoint[];
  memberGrowthByMonth: MemberGrowthPoint[];
  recentActivity: ActivityItem[];
  funnel: FunnelStage[];
  notifications: NotificationHealth;
  systemHealth: SystemHealthItem[];
  priorities: PriorityItem[];
  goals: DashboardGoals;
};

export type DashboardGoals = {
  id: string | null;
  year: number;
  month: number;
  premiumMembersGoal: number;
  monthlyRevenueGoalInCents: number;
  paidSignupsGoal: number;
  publishedArticlesGoal: number;
};

type ProfileRelation =
  | { display_name: string | null }
  | { display_name: string | null }[]
  | null;

type MembershipTransaction = {
  id: string;
  profile_id: string;
  stripe_checkout_session_id: string | null;
  stripe_subscription_id: string | null;
  stripe_event_id: string | null;
  amount: number | null;
  membership_type: string | null;
  payment_status: string | null;
  purchased_at: string | null;
  expires_at: string | null;
  created_at: string;
  profiles: ProfileRelation;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  membership: string | null;
  subscription_status: string | null;
  membership_expires_at: string | null;
  created_at: string | null;
  stripe_subscription_id: string | null;
};

type PickRow = {
  id: string;
  sport: string | null;
  selection: string | null;
  matchup: string | null;
  status: string | null;
  profit_loss: number | string | null;
  units: number | string | null;
  is_published: boolean | null;
  game_date: string | null;
  updated_at: string | null;
  published_at: string | null;
  created_at: string;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isPaidTransaction(transaction: MembershipTransaction) {
  return ["paid", "succeeded", "complete", "completed"].includes(
    normalize(transaction.payment_status),
  );
}

function isTestTransaction(transaction: MembershipTransaction) {
  return transaction.stripe_checkout_session_id?.startsWith("cs_test_") ?? false;
}

function transactionTimestamp(transaction: MembershipTransaction) {
  return new Date(transaction.purchased_at || transaction.created_at).getTime();
}

function deduplicateInitialSubscriptionTransactions(
  transactions: MembershipTransaction[],
) {
  return transactions.filter((transaction, _index, allTransactions) => {
    if (!transaction.stripe_subscription_id) return true;
    if (transaction.stripe_checkout_session_id) return true;

    const transactionTime = transactionTimestamp(transaction);

    const matchingCheckout = allTransactions.find((candidate) => {
      if (candidate.id === transaction.id) return false;
      if (
        candidate.stripe_subscription_id !== transaction.stripe_subscription_id
      ) {
        return false;
      }
      if (!candidate.stripe_checkout_session_id) return false;

      return (
        Math.abs(transactionTimestamp(candidate) - transactionTime) <= 10_000
      );
    });

    return !matchingCheckout;
  });
}

function getDisplayName(profile: ProfileRelation) {
  if (Array.isArray(profile)) {
    return profile[0]?.display_name?.trim() || "Premium member";
  }

  return profile?.display_name?.trim() || "Premium member";
}

function getPlanLabel(membershipType: string | null) {
  switch (membershipType) {
    case "one_day":
      return "1-Day";
    case "weekly":
      return "7-Day";
    case "monthly":
      return "30-Day";
    case "ninety_day":
      return "90-Day";
    default:
      return membershipType?.replaceAll("_", " ") || "Premium";
  }
}

function getMonthlyEquivalentInCents(
  membershipType: string | null,
  transactionAmountInCents: number,
) {
  switch (membershipType) {
    case "weekly":
      return transactionAmountInCents * (52 / 12);
    case "monthly":
      return transactionAmountInCents;
    case "ninety_day":
      return transactionAmountInCents / 3;
    default:
      return 0;
  }
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function safePercent(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function isTransactionActive(
  transaction: MembershipTransaction,
  now: Date,
) {
  if (!transaction.expires_at) return false;
  return new Date(transaction.expires_at) > now;
}

function isProfileActive(profile: ProfileRow, now: Date) {
  if (!profile.membership_expires_at) return false;
  if (new Date(profile.membership_expires_at) <= now) return false;

  const membership = normalize(profile.membership);
  const status = normalize(profile.subscription_status);

  return (
    membership === "premium" ||
    ["active", "trialing", "past_due", "one_time_active"].includes(status)
  );
}

function isGradedStatus(status: string | null) {
  return ["won", "lost", "push", "cancelled"].includes(normalize(status));
}

function isPendingStatus(status: string | null) {
  return normalize(status) === "pending";
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const userSupabase = await createServerClient();
  const adminSupabase = getSupabaseAdmin();

  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;

  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const previousMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const sixMonthsAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000);
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  const [
    adminProfileResponse,
    profilesResponse,
    transactionsResponse,
    picksResponse,
    goalsResponse,
  ] = await Promise.all([
    user
      ? adminSupabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    adminSupabase
      .from("profiles")
      .select(
        "id, display_name, membership, subscription_status, membership_expires_at, created_at, stripe_subscription_id",
      )
      .order("created_at", { ascending: false }),

    adminSupabase
      .from("membership_transactions")
      .select(
        `
          id,
          profile_id,
          stripe_checkout_session_id,
          stripe_subscription_id,
          stripe_event_id,
          amount,
          membership_type,
          payment_status,
          purchased_at,
          expires_at,
          created_at,
          profiles (display_name)
        `,
      )
      .order("created_at", { ascending: false }),

    adminSupabase
      .from("vip_picks")
      .select(
        "id, sport, selection, matchup, status, profit_loss, units, is_published, game_date, updated_at, published_at, created_at",
      )
      .gte("game_date", yearStart)
      .order("game_date", { ascending: false }),

    adminSupabase
      .from("dashboard_goals")
      .select(
        "id, year, month, premium_members_goal, monthly_revenue_goal_cents, paid_signups_goal",
      )
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .maybeSingle(),
  ]);

  if (adminProfileResponse.error) {
    console.error("Unable to load admin profile:", adminProfileResponse.error);
  }
  if (profilesResponse.error) {
    console.error("Unable to load profiles:", profilesResponse.error);
  }
  if (transactionsResponse.error) {
    console.error("Unable to load transactions:", transactionsResponse.error);
  }
  if (picksResponse.error) {
    console.error("Unable to load picks:", picksResponse.error);
  }
  if (goalsResponse.error) {
    console.error("Unable to load dashboard goals:", goalsResponse.error);
  }

  const profiles = (profilesResponse.data as ProfileRow[] | null) ?? [];
  const transactions =
    (transactionsResponse.data as unknown as MembershipTransaction[] | null) ?? [];
  const picks = (picksResponse.data as PickRow[] | null) ?? [];

  const paidTransactions = deduplicateInitialSubscriptionTransactions(
    transactions
      .filter(isPaidTransaction)
      .filter((transaction) => !isTestTransaction(transaction)),
  );

  const profileActiveIds = new Set(
    profiles
      .filter((profile) => isProfileActive(profile, now))
      .map((profile) => profile.id),
  );

  /*
   * Transaction expiry is used as a fallback source of truth. This protects
   * the dashboard if an older webhook did not populate the profile fields.
   */
  for (const transaction of paidTransactions) {
    if (isTransactionActive(transaction, now)) {
      profileActiveIds.add(transaction.profile_id);
    }
  }

  const activePremiumMembers = profileActiveIds.size;

  const currentMonthTransactions = paidTransactions.filter(
    (transaction) =>
      new Date(transaction.purchased_at || transaction.created_at) >=
      currentMonthStart,
  );

  const previousMonthTransactions = paidTransactions.filter((transaction) => {
    const date = new Date(transaction.purchased_at || transaction.created_at);
    return date >= previousMonthStart && date < currentMonthStart;
  });

  const currentMonthRevenueInCents = currentMonthTransactions.reduce(
    (sum, transaction) => sum + (transaction.amount ?? 0),
    0,
  );

  const previousMonthRevenueInCents = previousMonthTransactions.reduce(
    (sum, transaction) => sum + (transaction.amount ?? 0),
    0,
  );

  /*
   * Transactions are returned newest first. Keep the newest active recurring
   * transaction for each member, then normalize it to a monthly amount.
   */
const activeRecurringProfiles = profiles.filter((profile) => {
  const status = normalize(profile.subscription_status);

  return (
    Boolean(profile.stripe_subscription_id) &&
    ["active", "trialing"].includes(status) &&
    Boolean(profile.membership_expires_at) &&
    new Date(profile.membership_expires_at as string) > now
  );
});

const latestTransactionBySubscription = new Map<
  string,
  MembershipTransaction
>();

for (const transaction of paidTransactions) {
  const subscriptionId = transaction.stripe_subscription_id;

  if (!subscriptionId) {
    continue;
  }

  if (!latestTransactionBySubscription.has(subscriptionId)) {
    latestTransactionBySubscription.set(subscriptionId, transaction);
  }
}

const activeRecurringTransactions = activeRecurringProfiles
  .map((profile) => {
    if (!profile.stripe_subscription_id) {
      return null;
    }

    return latestTransactionBySubscription.get(
      profile.stripe_subscription_id,
    );
  })
  .filter(
    (
      transaction,
    ): transaction is MembershipTransaction =>
      Boolean(transaction) &&
      ["weekly", "monthly", "ninety_day"].includes(
        transaction?.membership_type ?? "",
      ),
  );

const mrrInCents = Math.round(
  activeRecurringTransactions.reduce(
    (sum, transaction) =>
      sum +
      getMonthlyEquivalentInCents(
        transaction.membership_type,
        transaction.amount ?? 0,
      ),
    0,
  ),
);

console.log(
  "MRR BREAKDOWN",
  activeRecurringTransactions.map((transaction) => ({
    profileId: transaction.profile_id,
    subscriptionId: transaction.stripe_subscription_id,
    plan: transaction.membership_type,
    chargedAmount: transaction.amount,
    monthlyEquivalent: Math.round(
      getMonthlyEquivalentInCents(
        transaction.membership_type,
        transaction.amount ?? 0,
      ),
    ),
    expiresAt: transaction.expires_at,
  })),
);

  const recurringBySubscription = new Map<string, MembershipTransaction[]>();

  for (const transaction of paidTransactions) {
    if (!transaction.stripe_subscription_id) continue;

    const existing =
      recurringBySubscription.get(transaction.stripe_subscription_id) ?? [];

    existing.push(transaction);
    recurringBySubscription.set(transaction.stripe_subscription_id, existing);
  }

  const recurringSubscriptions = [...recurringBySubscription.values()];
  const subscriptionsWithRenewal = recurringSubscriptions.filter(
    (items) => items.length >= 2,
  ).length;

  const renewalRate = safePercent(
    subscriptionsWithRenewal,
    recurringSubscriptions.length,
  );

  const churnRate =
    renewalRate === null ? null : Math.max(0, 100 - renewalRate);

  const newPremiumMembersThisMonth = new Set(
    currentMonthTransactions.map((transaction) => transaction.profile_id),
  ).size;

  const recentSignups: RecentSignup[] = paidTransactions
    .slice(0, 8)
    .map((transaction) => ({
      id: transaction.id,
      name: getDisplayName(transaction.profiles),
      plan: getPlanLabel(transaction.membership_type),
      joinedAt: transaction.purchased_at || transaction.created_at,
      expiresAt: transaction.expires_at,
      amountInCents: transaction.amount ?? 0,
    }));

  /*
   * The Results page grades picks through status values:
   * won, lost, push, and cancelled.
   */
  const sportsMap = new Map<string, TopSport>();

  for (const pick of picks) {
    if (!pick.is_published || !isGradedStatus(pick.status)) continue;
    if (normalize(pick.status) === "cancelled") continue;

    const result = normalize(pick.status);
    const sport = pick.sport?.trim().toUpperCase() || "OTHER";

    const current = sportsMap.get(sport) ?? {
      sport,
      units: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      picks: 0,
    };

    current.units += Number(pick.profit_loss ?? 0);
    current.picks += 1;

    if (result === "won") current.wins += 1;
    if (result === "lost") current.losses += 1;
    if (result === "push") current.pushes += 1;

    const decisions = current.wins + current.losses;
    current.winRate =
      decisions > 0 ? (current.wins / decisions) * 100 : 0;

    sportsMap.set(sport, current);
  }

  const topSports = [...sportsMap.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const monthlyRevenueMap = new Map<string, number>();

  for (const transaction of paidTransactions) {
    const date = new Date(transaction.purchased_at || transaction.created_at);

    if (date < sixMonthsAgo) continue;

    const key = monthKey(date);

    monthlyRevenueMap.set(
      key,
      (monthlyRevenueMap.get(key) ?? 0) + (transaction.amount ?? 0),
    );
  }

  const revenueByMonth: RevenuePoint[] = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
      );

      return {
        label: monthLabel(date),
        amountInCents: monthlyRevenueMap.get(monthKey(date)) ?? 0,
      };
    },
  );

  const monthlyMemberMap = new Map<string, Set<string>>();

  for (const transaction of paidTransactions) {
    const date = new Date(transaction.purchased_at || transaction.created_at);

    if (date < sixMonthsAgo) continue;

    const key = monthKey(date);
    const members = monthlyMemberMap.get(key) ?? new Set<string>();

    members.add(transaction.profile_id);
    monthlyMemberMap.set(key, members);
  }

  const memberGrowthByMonth: MemberGrowthPoint[] = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
      );

      return {
        label: monthLabel(date),
        members: monthlyMemberMap.get(monthKey(date))?.size ?? 0,
      };
    },
  );

  const membershipActivity: ActivityItem[] = paidTransactions
    .slice(0, 8)
    .map((transaction) => ({
      id: `membership-${transaction.id}`,
      title: transaction.stripe_checkout_session_id
        ? "Premium membership purchased"
        : "Premium membership renewed",
      description: `${getDisplayName(transaction.profiles)} purchased ${getPlanLabel(
        transaction.membership_type,
      )} access.`,
      createdAt: transaction.purchased_at || transaction.created_at,
      type: "membership",
    }));

  const pickActivity: ActivityItem[] = picks
    .filter((pick) => pick.is_published)
    .slice(0, 8)
    .map((pick) => {
      const graded = isGradedStatus(pick.status);
      const status = normalize(pick.status);
      const units = Number(pick.profit_loss ?? 0);

      return {
        id: `pick-${pick.id}`,
        title: graded
          ? `Pick graded ${status}`
          : "Premium pick published",
        description: graded
          ? `${pick.selection || pick.matchup || "Premium pick"} — ${
              units >= 0 ? "+" : ""
            }${units.toFixed(2)} units.`
          : pick.selection || pick.matchup || "Premium pick published.",
        createdAt:
          pick.updated_at ||
          pick.published_at ||
          pick.created_at,
        type: graded ? "result" : "pick",
      };
    });

  const recentActivity = [...membershipActivity, ...pickActivity]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const totalAccounts = profiles.length;
  const accountToPremiumConversion = safePercent(
    activePremiumMembers,
    totalAccounts,
  );

  /*
   * Match the Results page exactly: only status = pending is awaiting grading.
   */
  const openPicks = picks.filter(
    (pick) => pick.is_published && isPendingStatus(pick.status),
  );

  const expiringSoonIds = new Set<string>();

  for (const profile of profiles) {
    if (!profile.membership_expires_at) continue;

    const expiresAt = new Date(profile.membership_expires_at);

    if (expiresAt > now && expiresAt <= sevenDaysFromNow) {
      expiringSoonIds.add(profile.id);
    }
  }

  for (const transaction of paidTransactions) {
    if (!transaction.expires_at) continue;

    const expiresAt = new Date(transaction.expires_at);

    if (expiresAt > now && expiresAt <= sevenDaysFromNow) {
      expiringSoonIds.add(transaction.profile_id);
    }
  }

  const priorities: PriorityItem[] = [];

  if (expiringSoonIds.size > 0) {
    priorities.push({
      id: "expiring",
      severity: "high",
      title: `${expiringSoonIds.size} membership${
        expiringSoonIds.size === 1 ? "" : "s"
      } expiring soon`,
      description: "Review accounts expiring within the next seven days.",
      href: "/admin/members",
    });
  }

  if (openPicks.length > 0) {
    priorities.push({
      id: "open-picks",
      severity: "medium",
      title: `${openPicks.length} open pick${
        openPicks.length === 1 ? "" : "s"
      } awaiting grading`,
      description: "Keep the Results page current by grading pending selections.",
      href: "/admin/results",
    });
  }

  const revenueChangePercent = percentageChange(
    currentMonthRevenueInCents,
    previousMonthRevenueInCents,
  );

  if (revenueChangePercent !== null && revenueChangePercent > 0) {
    priorities.push({
      id: "revenue-growth",
      severity: "positive",
      title: `Revenue is up ${revenueChangePercent.toFixed(1)}%`,
      description: "Current-month revenue is ahead of the previous month.",
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      id: "all-clear",
      severity: "positive",
      title: "No urgent issues detected",
      description: "Memberships, results, and revenue data look current.",
    });
  }

  const notifications: NotificationHealth = {
    emailConfigured: Boolean(process.env.RESEND_API_KEY),
    smsConfigured: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER,
    ),
    emailProvider: "Resend",
    smsProvider: "Twilio",
  };

  const systemHealth: SystemHealthItem[] = [
    {
      name: "Supabase",
      status:
        profilesResponse.error ||
        transactionsResponse.error ||
        picksResponse.error ||
        goalsResponse.error
          ? "warning"
          : "healthy",
      description:
        profilesResponse.error ||
        transactionsResponse.error ||
        picksResponse.error ||
        goalsResponse.error
          ? "One or more dashboard queries failed"
          : "Database connected",
    },
    {
      name: "Stripe",
      status: process.env.STRIPE_SECRET_KEY ? "healthy" : "warning",
      description: process.env.STRIPE_SECRET_KEY
        ? "Payments configured"
        : "Missing secret key",
    },
    {
      name: "Resend",
      status: notifications.emailConfigured ? "healthy" : "warning",
      description: notifications.emailConfigured
        ? "Email configured"
        : "Email not configured",
    },
    {
      name: "Twilio",
      status: notifications.smsConfigured ? "healthy" : "warning",
      description: notifications.smsConfigured
        ? "SMS configured"
        : "SMS pending configuration",
    },
    {
      name: "Sanity",
      status: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
        ? "healthy"
        : "warning",
      description: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
        ? "CMS configured"
        : "CMS key not detected",
    },
    {
      name: "Vercel",
      status: process.env.VERCEL ? "healthy" : "warning",
      description: process.env.VERCEL
        ? "Production environment"
        : "Local environment",
    },
  ];

  const goals: DashboardGoals = {
    id: goalsResponse.data?.id ?? null,
    year: currentYear,
    month: currentMonth,
    premiumMembersGoal: goalsResponse.data?.premium_members_goal ?? 50,
    monthlyRevenueGoalInCents:
      goalsResponse.data?.monthly_revenue_goal_cents ?? 150_000,
    paidSignupsGoal: goalsResponse.data?.paid_signups_goal ?? 20,
    publishedArticlesGoal: 8,
  };

  return {
    adminName:
      adminProfileResponse.data?.display_name?.trim() ||
      user?.email?.split("@")[0] ||
      "Admin",
    activePremiumMembers,
    newPremiumMembersThisMonth,
    mrrInCents,
    currentMonthRevenueInCents,
    previousMonthRevenueInCents,
    revenueChangePercent,
    renewalRate,
    churnRate,
    accountToPremiumConversion,
    totalAccounts,
    recentSignups,
    topSports,
    revenueByMonth,
    memberGrowthByMonth,
    recentActivity,
    funnel: [
      {
        label: "Visitors",
        value: null,
        note: "Connect the GA4 Data API to populate visitor totals.",
      },
      { label: "Accounts", value: totalAccounts },
      { label: "Active Premium", value: activePremiumMembers },
    ],
    notifications,
    systemHealth,
    priorities,
    goals,
  };
}
