const SESSION_KEY = "growth_session_id";
const ANON_KEY = "growth_anonymous_id";

function generateId() {
  return crypto.randomUUID();
}

export function getGrowthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return null;
  }

  let anonymousId = localStorage.getItem(ANON_KEY);

  if (!anonymousId) {
    anonymousId = generateId();
    localStorage.setItem(ANON_KEY, anonymousId);
  }

  return anonymousId;
}