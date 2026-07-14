import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "hvrg_checkout_draft";

const initial = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    email: "", name: "", address1: "", address2: "",
    city: "", state: "", postal: "", country: "US", phone: "",
    isGuest: true,
    touched: {}, errors: {},
    step: "idle", orderId: null, claimToken: null, totalCents: 0,
  };
};

const slice = createSlice({
  name: "checkout",
  initialState: initial(),
  reducers: {
    setField: (state, { payload }) => {
      const { name, value } = payload;
      state[name] = value;
      if (state.errors[name]) delete state.errors[name];
    },
    setError: (state, { payload }) => {
      const { name, message } = payload;
      if (message) state.errors[name] = message;
      else delete state.errors[name];
    },
    setTouched: (state, { payload }) => { state.touched[payload] = true; },
    setStep: (state, { payload }) => { state.step = payload; },
    setGuest: (state, { payload }) => { state.isGuest = !!payload; },
    setOrder: (state, { payload }) => {
      state.orderId = payload.orderId;
      state.claimToken = payload.claimToken || null;
      state.step = "placed";
    },
    reset: () => initial(),
    hydrate: (_state, { payload }) => payload,
  },
});

export const { setField, setError, setTouched, setStep, setGuest, setOrder, reset, hydrate } = slice.actions;
export default slice.reducer;

let saveTimer;
export const persistMiddleware = ({ getState }) => (next) => (action) => {
  const result = next(action);
  if (typeof action.type === "string" && action.type.startsWith("checkout/")) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(getState().checkout || {})); } catch {}
    }, 200);
  }
  return result;
};
