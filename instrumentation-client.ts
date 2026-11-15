import { analytics } from "@heycatch/sdk";
import { createClient } from "@/lib/supabase/client";
import { identifyHeyCatchUser } from "@/lib/analytics/heycatch-auth";

analytics.init({
  projectKey: "hck_pk_Iop4R8zHj3XrDsKXvt3xOdpkxpeppyKE",
  site: "landing",
  install: { framework: "nextjs", frameworkVersion: "16", agent: "codex" },
});

// Autocapture handles navigation and clicks; only auth outcomes are explicit.
createClient().auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") analytics.resetIdentity();
  if (
    (event === "INITIAL_SESSION" ||
      event === "SIGNED_IN" ||
      event === "USER_UPDATED") &&
    session?.user
  ) {
    identifyHeyCatchUser(session.user);
  }
});
