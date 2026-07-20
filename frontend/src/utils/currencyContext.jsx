/**
 * CurrencyProvider — fetches rates once on mount, holds the user's chosen
 * currency in localStorage, exposes `useCurrency()` for any component to
 * read `code`, `rate`, `rates`, and a convenience format helper.
 *
 * Backend source of truth: backing prices are always USD. This module only
 * affects display, never what gets charged.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { fmtInCurrency } from "../utils/fmtInCurrency";

const STORAGE_KEY = "preferredCurrency";
const DEFAULT = { code: "USD", rate: 1, symbol: "$" };

const CurrencyContext = createContext({
  ...DEFAULT,
  rates: { USD: 1 },
  setCurrency: () => {},
  fmt: (v) => fmtInCurrency(v, "USD", 1),
  loaded: false,
});

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState({ USD: 1 });
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem(STORAGE_KEY) || "USD";
  });
  const [locked, setLocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/currency/rates?base=USD", {
          credentials: "include",
        });
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled || !body?.rates) return;
        setRates(body.rates);
      } catch {
        // upstream down → stay on USD only
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback(
    (next) => {
      if (locked) return; // prevent changes once locked
      setCode(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
    },
    [locked]
  );

  const lockCurrency = useCallback(() => setLocked(true), []);
  const unlockCurrency = useCallback(() => setLocked(false), []);

  const rate = rates[code] || (code === "USD" ? 1 : 1); // fall back to 1:1

  const value = useMemo(() => {
    const symbol = (() => {
      try {
        return (0)
          .toLocaleString(undefined, {
            style: "currency",
            currency: code,
            minimumFractionDigits: 0,
          })
          .replace(/\d/g, "")
          .replace(/[.,\s]/g, "");
      } catch {
        return code;
      }
    })();
    return {
      code,
      rate,
      rates,
      setCurrency,
      locked,
      lockCurrency,
      unlockCurrency,
      symbol,
      loaded,
      fmt: (v) => fmtInCurrency(v, code, rate),
    };
  }, [code, rate, rates, setCurrency, loaded, locked, lockCurrency, unlockCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

export default CurrencyProvider;
