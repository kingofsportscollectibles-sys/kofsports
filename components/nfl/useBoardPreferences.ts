"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  boardPreferencesKey,
  readBoardPreferences,
  validateBoardPreferences,
  type BoardPreferences,
} from "@/lib/nfl/board-preferences";
const memory = new Map<string, string>();
const EVENT = "kofsports:board-preferences";
function snapshot(key: string | null) {
  if (!key) return "";
  if (memory.has(key)) return memory.get(key)!;
  try {
    const value = localStorage.getItem(key) ?? "";
    memory.set(key, value);
    return value;
  } catch {
    return "";
  }
}
const serverSnapshot = () => "";
export function useBoardPreferences(userId: string | null) {
  const key = userId ? boardPreferencesKey(userId) : null;
  const subscribe = useCallback(
    (notify: () => void) => {
      const change = (e: Event) => {
        if (e instanceof StorageEvent) {
          if (e.key !== key && e.key !== null) return;
          if (key) memory.set(key, e.key === null ? "" : (e.newValue ?? ""));
        }
        notify();
      };
      window.addEventListener(EVENT, change);
      window.addEventListener("storage", change);
      return () => {
        window.removeEventListener(EVENT, change);
        window.removeEventListener("storage", change);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    serverSnapshot,
  );
  const preferences = useMemo(() => readBoardPreferences(raw), [raw]);
  const update = useCallback(
    (next: BoardPreferences) => {
      if (!key) return;
      const value = JSON.stringify(validateBoardPreferences(next));
      memory.set(key, value);
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Keep this session usable without persistent storage. */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return { preferences, update };
}
