import { useEffect, type RefObject } from "react";

// Closes a popup menu when the user clicks outside it or presses Escape.
export default function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) close(); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [ref, open, close]);
}
