// Persistence for the mock backend: JSON values in this browser's localStorage, shared by the clinician and patient
// sides. If storage is blocked or full, values are kept in memory instead and last until the page is reloaded.

/** Keys with this prefix are demo data and are wiped by "รีเซ็ตข้อมูลทดลอง". */
export const DEMO_PREFIX = "mindflow:";

const memory = new Map<string, string>();

function getRaw(key: string) {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  } catch {
    // Storage blocked: fall back to memory.
  }
  return memory.get(key) ?? null;
}

export function read<T>(key: string, fallback: T): T {
  const raw = getRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    // Storage blocked or full: the in-memory copy is used until reload.
  }
}

/** Reads `key`, or saves and returns `seed()` the first time, so seeded demo data stays stable across visits. */
export function readOrSeed<T>(key: string, seed: () => T): T {
  const raw = getRaw(key);
  if (raw !== null) return read(key, seed());
  const value = seed();
  write(key, value);
  return value;
}

export function clearDemoData() {
  [...memory.keys()].filter((key) => key.startsWith(DEMO_PREFIX)).forEach((key) => memory.delete(key));
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(DEMO_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Nothing persisted to clear.
  }
}
