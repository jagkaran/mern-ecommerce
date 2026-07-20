// components/ToastHost.js
// Renders the toast queue. Mount once near the app root (after Provider).
// Hverdag-themed: top-right under header, sage/terracotta/mustard/stone
// per variant, soft unfurl easing.

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { dismissToast } from "../reducers/toastReducer";
import "../hooks/hverdagToast.css";

export default function ToastHost() {
  const items = useSelector((s) => s.toast?.items ?? []);
  const dispatch = useDispatch();

  // Auto-dismiss each toast after its durationMs. We re-arm on every
  // items change so a fresh queue rebuilds all timers.
  useEffect(() => {
    if (!items.length) return undefined;
    const timers = items.map((t) => setTimeout(() => dispatch(dismissToast(t.id)), t.durationMs));
    return () => timers.forEach(clearTimeout);
  }, [items, dispatch]);

  return (
    <div className="hverdag-toasts" role="region" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`hverdag-toast hverdag-toast--${t.variant}`}
          data-toast-id={t.id}
        >
          <span className="hverdag-toast__message">{t.message}</span>
          <button
            type="button"
            className="hverdag-toast__close"
            aria-label="Dismiss notification"
            onClick={() => dispatch(dismissToast(t.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
