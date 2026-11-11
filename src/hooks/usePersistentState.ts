import { useEffect, useState } from "react";

/**
 * useState that remembers its value in this browser (localStorage), for UI preferences such as a collapsed panel.
 * Not for app data — that goes through `api` so it can live on the backend.
 */
export default function usePersistentState<T>(key: string, initial: T) {
  const storageKey = `mindflow:ui:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage blocked: the value lasts for this visit only.
    }
  }, [storageKey, value]);
  return [value, setValue] as const;
}
