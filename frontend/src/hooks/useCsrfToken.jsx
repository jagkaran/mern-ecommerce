import { useEffect, useRef, useCallback } from "react";
import axios from "axios";

/**
 * useCsrfToken — per-instance CSRF token.
 *
 * Replaces the previous module-level `let _csrfToken = null;` singleton which
 * had two problems:
 *   1) Two <App /> instances (HMR, StrictMode double-mount, parallel tests)
 *      could each set the singleton, last write wins.
 *   2) After logout the token was still attached to mutating requests until
 *      the next /csrf-token refresh.
 *
 * Each useCsrfToken() call uses its own useRef, so the lifetime is tied to
 * the calling component. The returned `applyCsrf(headers)` mutator is a stable
 * callback for use inside an axios request interceptor.
 */
export function useCsrfToken() {
  const tokenRef = useRef(null);
  const inflightRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      // Dedupe concurrent fetches
      if (inflightRef.current) return inflightRef.current;
      inflightRef.current = axios
        .get("/api/v1/csrf-token")
        .then((res) => {
          tokenRef.current = res.data.csrfToken || null;
        })
        .catch(() => {
          tokenRef.current = null;
        })
        .finally(() => {
          inflightRef.current = null;
        });
      return inflightRef.current;
    } catch {
      tokenRef.current = null;
      return null;
    }
  }, []);

  // Mutator — pass to axios.interceptors.request.use
  const applyCsrf = useCallback((config) => {
    const method = (config.method || "get").toLowerCase();
    const mutating = ["post", "put", "delete", "patch"].includes(method);
    if (mutating && tokenRef.current) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = tokenRef.current;
    }
    return config;
  }, []);

  const clear = useCallback(() => {
    tokenRef.current = null;
  }, []);

  // One-time setup: withCredentials + interceptor + initial fetch
  useEffect(() => {
    axios.defaults.withCredentials = true;
    const interceptor = axios.interceptors.request.use(applyCsrf);
    refresh();
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
    // applyCsrf is stable; refresh is stable
  }, [applyCsrf, refresh]);

  return { tokenRef, refresh, clear };
}

export default useCsrfToken;
