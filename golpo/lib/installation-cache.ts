export const INSTALLATION_CACHE_KEY = "installation-flow-v1";
export const SESSION_ID_KEY = "installation-session-id-v1";

export type InstallationDraft = {
  name: string;
};

export const defaultDraft: InstallationDraft = {
  name: "",
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  const existing = window.localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const newId = generateId();
  window.localStorage.setItem(SESSION_ID_KEY, newId);
  return newId;
}

/** Call this when a new person starts the flow (on name form submit). */
export function createNewSession(): string {
  const newId = generateId();
  window.localStorage.setItem(SESSION_ID_KEY, newId);
  window.localStorage.removeItem(INSTALLATION_CACHE_KEY);
  return newId;
}