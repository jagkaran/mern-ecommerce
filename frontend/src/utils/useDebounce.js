import { useEffect, useState } from "react";

// Returns `value` after it's been stable for `delay` ms. Used to throttle
// search input → API calls.
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
