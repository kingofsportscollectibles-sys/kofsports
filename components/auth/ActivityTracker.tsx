"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const ACTIVITY_INTERVAL_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

export default function ActivityTracker() {
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  const userIdRef = useRef<string | null>(null);
  const lastSentAtRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const touchActivity = async (force = false) => {
      if (!mounted) return;
      if (!userIdRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (inFlightRef.current) return;

      const now = Date.now();

      if (
        !force &&
        now - lastSentAtRef.current < ACTIVITY_INTERVAL_MS
      ) {
        return;
      }

      inFlightRef.current = true;

      try {
        const { error } = await supabase.rpc("touch_last_active", {
          p_path: pathnameRef.current || "/",
        });

        if (!error && mounted) {
          lastSentAtRef.current = Date.now();
        }

        if (error) {
          console.error("Unable to update user activity:", error);
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      userIdRef.current = session?.user?.id ?? null;

      if (userIdRef.current) {
        void touchActivity(true);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const previousUserId = userIdRef.current;
      const nextUserId = session?.user?.id ?? null;

      userIdRef.current = nextUserId;

      if (!nextUserId) {
        lastSentAtRef.current = 0;
        return;
      }

      if (nextUserId !== previousUserId) {
        lastSentAtRef.current = 0;
        void touchActivity(true);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void touchActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      void touchActivity();
    }, CHECK_INTERVAL_MS);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;

    pathnameRef.current = pathname;
  }, [pathname]);

  return null;
}
