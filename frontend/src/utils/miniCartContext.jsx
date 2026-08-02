import { createContext, useContext, useState, useCallback } from "react";

// Mini-cart drawer state. Lives at app root so any page (PDP, PLP, Header)
// can open the drawer without prop-drilling. Pair with <MiniCartDrawer />
// mounted in RootLayout.

const MiniCartContext = createContext(null);

export function MiniCartProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  return (
    <MiniCartContext.Provider value={{ open, setOpen, openCart, closeCart }}>
      {children}
    </MiniCartContext.Provider>
  );
}

export function useMiniCart() {
  const ctx = useContext(MiniCartContext);
  if (!ctx) {
    throw new Error("useMiniCart must be used within <MiniCartProvider>");
  }
  return ctx;
}
