const KEY = "tv_dictator_locked_session";

export function isDictatorLockedForSession(sessionId) {
  if (!sessionId || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === String(sessionId);
  } catch {
    return false;
  }
}

export function persistDictatorComplete(sessionId) {
  try {
    if (sessionId) window.localStorage.setItem(KEY, String(sessionId));
  } catch {
    /* ignore quota / private mode */
  }
}
