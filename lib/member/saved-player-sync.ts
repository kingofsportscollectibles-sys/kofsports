// Signals contain no player list or research data. Each recipient re-reads its own RLS-scoped saves.
export const SAVED_PLAYERS_SIGNAL = "kofsports:saved-players-changed";
export const SAVED_PLAYERS_STORAGE_SIGNAL = "kof_saved_players_changed_v1";
export function notifySavedPlayersChanged(userId: string, origin?: string) {
  try {
    const detail = { userId, origin, nonce: crypto.randomUUID() };
    window.dispatchEvent(new CustomEvent(SAVED_PLAYERS_SIGNAL, { detail }));
    localStorage.setItem(SAVED_PLAYERS_STORAGE_SIGNAL, JSON.stringify(detail));
  } catch {
    /* A local success still updates its provider when storage is unavailable. */
  }
}
