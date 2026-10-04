/**
 * Tiny pop-up notification bus. Call toast.error("...") from any client
 * code; the <Toaster /> in the root layout shows it.
 */
export type ToastKind = "error" | "success" | "info";
export type ToastInput = { kind: ToastKind; title?: string; message: string; duration?: number };

const EVENT = "app:toast";

function emit(t: ToastInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: t }));
}

export const toast = {
  error: (message: string, title = "That didn't work") => emit({ kind: "error", title, message, duration: 7000 }),
  success: (message: string, title?: string) => emit({ kind: "success", title, message }),
  info: (message: string, title?: string) => emit({ kind: "info", title, message }),
  /** Shows an action result: errors as errors, the rest as a quiet success. */
  result: (res: { ok: boolean; message: string }) => (res.ok ? toast.success(res.message) : toast.error(res.message)),
};

export const TOAST_EVENT = EVENT;
