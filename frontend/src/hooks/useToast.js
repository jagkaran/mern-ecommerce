// hooks/useToast.js
// Drop-in replacement for react-alert's useAlert(). Returns the same
// {success, error, info, warning, dismiss} surface so call sites migrate
// in place.
//
// The returned object is memoized so it can safely appear in useEffect
// dependency arrays without causing runaway re-renders.

import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { pushToast, dismissToast } from "../reducers/toastReducer";

export function useToast() {
  const dispatch = useDispatch();

  // Stable factory: each variant builds a dispatcher of the same identity
  // across renders.
  const makePusher = useCallback(
    (variant) => (message, durationMs) => dispatch(pushToast(message, variant, durationMs)),
    [dispatch]
  );

  const success = useMemo(() => makePusher("success"), [makePusher]);
  const error = useMemo(() => makePusher("error"), [makePusher]);
  const info = useMemo(() => makePusher("info"), [makePusher]);
  const warning = useMemo(() => makePusher("warning"), [makePusher]);
  const dismiss = useMemo(() => (id) => dispatch(dismissToast(id)), [dispatch]);

  return useMemo(
    () => ({ success, error, info, warning, dismiss }),
    [success, error, info, warning, dismiss]
  );
}
