import type { Session } from "../types";

// The signed-in user. It is kept in sessionStorage so a page reload stays signed in, and in memory so it still works
// when storage is blocked (e.g. private mode). The API clients read it to know who is calling.
const SESSION_KEY = "mindflow-session";

function restore(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return (session.role === "clinician" || session.role === "patient") && session.email && session.name ? session : null;
  } catch {
    return null;
  }
}

let current = restore();

export const currentSession = () => current;

export function saveSession(session: Session) {
  current = session;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the session only lasts until the page is closed or reloaded.
  }
}

export function clearSession() {
  current = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}
