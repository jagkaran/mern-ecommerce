import { createContext, useContext, useState, useCallback } from "react";

const SearchOverlayContext = createContext(null);

export function SearchOverlayProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openOverlay = useCallback(() => setOpen(true), []);
  const closeOverlay = useCallback(() => setOpen(false), []);
  return (
    <SearchOverlayContext.Provider value={{ open, openOverlay, closeOverlay }}>
      {children}
    </SearchOverlayContext.Provider>
  );
}

export function useSearchOverlay() {
  const ctx = useContext(SearchOverlayContext);
  if (!ctx) {
    throw new Error("useSearchOverlay must be used within <SearchOverlayProvider>");
  }
  return ctx;
}
