// components/Home/Header/useCurrencyLock.js
// Locks the currency selector on routes where the order currency must stay
// stable (cart + shipping). Unlocks everywhere else so the user can change
// the displayed currency freely.

import { useEffect } from "react";

export default function useCurrencyLock(pathname, { lockCurrency, unlockCurrency }) {
  useEffect(() => {
    if (pathname === "/cart" || pathname === "/shipping") {
      lockCurrency();
    } else {
      unlockCurrency();
    }
  }, [pathname, lockCurrency, unlockCurrency]);
}
