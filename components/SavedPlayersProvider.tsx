"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  notifySavedPlayersChanged,
  SAVED_PLAYERS_SIGNAL,
  SAVED_PLAYERS_STORAGE_SIGNAL,
} from "@/lib/member/saved-player-sync";
type Sport = "nfl" | "nba" | "nhl";
type Value = {
  userId: string | null;
  loading: boolean;
  error: string | null;
  savedIds: Set<string>;
  reload: () => void;
  setPlayerSaved: (
    sport: Sport,
    playerId: string,
    saved: boolean,
    expectedUserId?: string,
  ) => void;
};
const Context = createContext<Value | null>(null);
export function SavedPlayersProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const owner = useRef<string | null>(null),
    origin = useRef(""),
    loadRef = useRef<() => Promise<void>>(async () => {}),
    invalidate = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false,
      revision = 0;
    const client = createClient();
    origin.current = crypto.randomUUID();
    function clear() {
      owner.current = null;
      setUserId(null);
      setSavedIds(new Set());
      setError(null);
      setLoading(false);
    }
    async function load() {
      const current = ++revision;
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: authError,
        } = await client.auth.getUser();
        if (cancelled || current !== revision) return;
        if (
          authError?.name === "AuthSessionMissingError" ||
          (!authError && !user)
        ) {
          clear();
          return;
        }
        if (authError || !user) throw Error("Identity unavailable");
        if (owner.current !== user.id) {
          owner.current = user.id;
          setUserId(user.id);
          setSavedIds(new Set());
        }
        const { data, error: queryError } = await client
          .from("saved_players")
          .select("sport, player_id")
          .eq("user_id", user.id);
        if (cancelled || current !== revision || owner.current !== user.id)
          return;
        if (queryError) throw queryError;
        setSavedIds(
          new Set(
            (data ?? [])
              .filter(
                (r) =>
                  ["nfl", "nba", "nhl"].includes(r.sport) &&
                  typeof r.player_id === "string",
              )
              .map((r) => `${r.sport}:${r.player_id}`),
          ),
        );
      } catch {
        if (!cancelled && current === revision)
          setError("Unable to load saved players. Please try again.");
      } finally {
        if (!cancelled && current === revision) setLoading(false);
      }
    }
    loadRef.current = load;
    invalidate.current = () => {
      revision++;
      setLoading(false);
      setError(null);
    };
    void load();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        revision++;
        clear();
      } else if (event === "SIGNED_IN" && session?.user.id !== owner.current) {
        revision++;
        clear();
        setLoading(true);
        setTimeout(() => {
          if (!cancelled) void load();
        }, 0);
      }
    });
    function receive(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.userId === owner.current && detail?.origin !== origin.current)
        void load();
    }
    function storage(event: StorageEvent) {
      if (event.key !== SAVED_PLAYERS_STORAGE_SIGNAL || !event.newValue) return;
      try {
        if (JSON.parse(event.newValue).userId === owner.current) void load();
      } catch {
        /* Ignore malformed signals. */
      }
    }
    const focus = () => {
      void load();
    };
    window.addEventListener(SAVED_PLAYERS_SIGNAL, receive);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", focus);
    return () => {
      cancelled = true;
      revision++;
      subscription.unsubscribe();
      window.removeEventListener(SAVED_PLAYERS_SIGNAL, receive);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", focus);
    };
  }, []);
  const setPlayerSaved = useCallback(
    (
      sport: Sport,
      playerId: string,
      saved: boolean,
      expectedUserId?: string,
    ) => {
      if (
        !owner.current ||
        (expectedUserId && expectedUserId !== owner.current)
      )
        return;
      invalidate.current();
      setSavedIds((previous) => {
        const next = new Set(previous);
        const key = `${sport}:${playerId}`;
        if (saved) next.add(key);
        else next.delete(key);
        return next;
      });
      notifySavedPlayersChanged(owner.current, origin.current);
    },
    [],
  );
  const reload = useCallback(() => {
    void loadRef.current();
  }, []);
  const value = useMemo(
    () => ({ userId, loading, error, savedIds, setPlayerSaved, reload }),
    [userId, loading, error, savedIds, setPlayerSaved, reload],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSavedPlayers() {
  const value = useContext(Context);
  if (!value) throw Error("useSavedPlayers requires SavedPlayersProvider");
  return value;
}
