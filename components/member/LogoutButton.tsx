"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Unable to log out:", error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-amber-300 transition-all duration-200 hover:border-amber-400 hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>{loading ? "⏳" : "↩"}</span>

      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}