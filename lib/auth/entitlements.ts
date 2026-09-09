import { createClient } from "@/lib/supabase/server";

export type KofSportsProduct =
  | "premium_picks"
  | "kofsports_pro";

type Entitlement = {
  product: KofSportsProduct;
  status: "active" | "trialing" | "canceled" | "expired";
  starts_at: string;
  expires_at: string | null;
};

export async function hasProductAccess(
  product: KofSportsProduct,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role, membership")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Unable to load profile for entitlement check:",
      profileError,
    );
  }

  // Admins always have access.
  if (profile?.role === "admin") {
    return true;
  }

  /*
   * Premium Picks includes KofSports Pro at no additional cost.
   */
  if (
    product === "kofsports_pro" &&
    profile?.membership === "premium"
  ) {
    return true;
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select(
      "product, status, starts_at, expires_at",
    )
    .eq("user_id", user.id)
    .eq("product", product)
    .in("status", ["active", "trialing"]);

  if (error) {
    console.error(
      "Unable to load user entitlements:",
      error,
    );

    return false;
  }

  const now = Date.now();

  return ((data ?? []) as Entitlement[]).some(
    (entitlement) => {
      const startsAt =
        new Date(entitlement.starts_at).getTime();

      const expiresAt =
        entitlement.expires_at === null
          ? null
          : new Date(
              entitlement.expires_at,
            ).getTime();

      const hasStarted =
        Number.isFinite(startsAt) &&
        startsAt <= now;

      const hasNotExpired =
        expiresAt === null ||
        (Number.isFinite(expiresAt) &&
          expiresAt > now);

      return hasStarted && hasNotExpired;
    },
  );
}

export async function hasKofSportsProAccess() {
  return hasProductAccess("kofsports_pro");
}

export async function hasPremiumPicksEntitlement() {
  return hasProductAccess("premium_picks");
}
