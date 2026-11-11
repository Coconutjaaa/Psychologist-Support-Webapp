import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { errorMessage } from "../api";
import Icon from "./Icon";

type Tone = "success" | "error";
type Notify = (message: string, tone?: Tone) => void;

const ToastContext = createContext<Notify>(() => {});

/** Shows a short message at the bottom of the screen: `notify("บันทึกแล้ว")` or `notify(text, "error")`. */
export const useToast = () => useContext(ToastContext);

/**
 * Runs an API call: on success hands its result to `onSuccess`, on failure shows an error toast.
 * Resolves to whether it succeeded. `run(() => api.notes.create(id, text), (note) => notes.mutate(...))`
 */
export function useApiAction() {
  const notify = useToast();
  return useCallback(
    async <T,>(action: () => Promise<T>, onSuccess?: (result: T) => void): Promise<boolean> => {
      let result: T;
      try {
        result = await action();
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
      onSuccess?.(result);
      return true;
    },
    [notify],
  );
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const timer = useRef(0);
  const notify = useCallback<Notify>((message, tone = "success") => {
    setToast({ message, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className={`toast ${toast.tone === "error" ? "toast-error" : ""}`} key={toast.message}>
            <Icon name={toast.tone === "error" ? "info" : "check"} size={16} />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
