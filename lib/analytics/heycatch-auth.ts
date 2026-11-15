import { analytics } from "@heycatch/sdk";
import type { User } from "@supabase/supabase-js";

const pendingSignupKey = "kof_heycatch_pending_signup";

export function identifyHeyCatchUser(user: User) {
  // Keep third-party analytics free of names, email addresses and auth tokens.
  analytics.setIdentity(user.id, {}, { signup_date: user.created_at });
  try {
    if (
      user.email_confirmed_at &&
      localStorage.getItem(pendingSignupKey) === user.id
    ) {
      localStorage.removeItem(pendingSignupKey);
      analytics.trackEvent("signup_completed");
    }
  } catch {
    // Storage restrictions must not interfere with authentication.
  }
}

export function rememberHeyCatchSignup(user: User, hasSession: boolean) {
  // Supabase can return an obfuscated existing account with no identities.
  if (!user.identities?.length) return;
  if (hasSession) {
    analytics.setIdentity(user.id, {}, { signup_date: user.created_at });
    analytics.trackEvent("signup_completed");
    return;
  }
  try {
    localStorage.setItem(pendingSignupKey, user.id);
  } catch {
    // A confirmation on another browser remains unattributed, not invented.
  }
}
