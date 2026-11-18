// Keep player identity in the URL so namesakes and name changes are safe.
export function getNhlPlayerSlug(playerId: number, playerName: string): string {
  const name = playerName.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’\.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${name || "player"}-${playerId}`;
}

export function getNhlPlayerIdFromSlug(slug: string): number | null {
  const match = /^[a-z0-9]+(?:-[a-z0-9]+)*-([1-9]\d*)$/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}
