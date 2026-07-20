"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  onSignedOut?: () => void;
};

export function SignOutButton({
  className,
  onSignedOut,
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Unable to sign out:", error);
        setIsSigningOut(false);
        return;
      }

      onSignedOut?.();

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Unexpected sign-out error:", error);
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={className}
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}