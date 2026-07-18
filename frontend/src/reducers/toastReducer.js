// reducers/toastReducer.js
// Hverdag toast slice. Replaces the legacy react-alert API with a plain
// Redux store + custom ToastHost renderer.
//
// API (via useToast hook):
//   toast.success("msg", durationMs?)
//   toast.error("msg", durationMs?)
//   toast.info("msg", durationMs?)
//   toast.warning("msg", durationMs?)
//   toast.dismiss(id)
//
// Toasts auto-dismiss after `durationMs` (default 4000). Host renders
// top-right with Hverdag tokens (sage/terracotta/mustard/stone).

import { createSlice, nanoid } from "@reduxjs/toolkit";

const DEFAULT_DURATION = 4000;

const toastSlice = createSlice({
  name: "toast",
  initialState: { items: [] },
  reducers: {
    push: {
      reducer(state, action) {
        state.items.push(action.payload);
      },
      prepare(message, variant = "info", durationMs = DEFAULT_DURATION) {
        return {
          payload: {
            id: nanoid(),
            message,
            variant,
            durationMs,
            createdAt: Date.now(),
          },
        };
      },
    },
    dismiss(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clear(state) {
      state.items = [];
    },
  },
});

export const { push: pushToast, dismiss: dismissToast, clear: clearToasts } = toastSlice.actions;
export const toastReducer = toastSlice.reducer;
