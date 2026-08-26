"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
  /**
   * Convenience wrapper for server-action results: shows the error and
   * returns false, so callers can `if (!ok) return;` and roll back.
   */
  report: (result: { error?: string } | null | undefined, successMessage?: string) => boolean;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const notify = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, variant === "error" ? 6000 : 3500);
  }, []);

  const report = useCallback<ToastContextValue["report"]>(
    (result, successMessage) => {
      if (result && "error" in result && result.error) {
        notify(result.error, "error");
        return false;
      }
      if (successMessage) notify(successMessage, "success");
      return true;
    },
    [notify]
  );

  return (
    <ToastContext.Provider value={{ notify, report }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-[min(92vw,22rem)]"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-start gap-2.5 rounded-md border px-3.5 py-3 shadow-modal backdrop-blur animate-fade-in-up",
                  toast.variant === "error"
                    ? "border-danger/30 bg-danger/10 text-white"
                    : "border-success/30 bg-success/10 text-white"
                )}
              >
                {toast.variant === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                )}
                <p className="text-sm leading-snug flex-1">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  aria-label="Dismiss notification"
                  className="text-faint hover:text-white transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Fall back to a no-op-with-console implementation so components remain
  // usable (e.g. in the customer portal) even outside the provider.
  if (!ctx) {
    return {
      notify: (message, variant) => {
        if (variant === "error") console.error("[toast]", message);
      },
      report: (result) => !(result && "error" in result && result.error),
    };
  }
  return ctx;
}
