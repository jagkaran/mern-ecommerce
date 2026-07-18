import React, { useEffect, useRef, useState } from "react";
import { Stack } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { PrimaryBtn, Field } from "../../design/primitives";

export default function ClaimForm({ claimToken }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  // Track mount state so post-await state updates don't fire on an unmounted
  // component — keeps the console clean when the user submits and is
  // navigated away by `navigate("/myorders")` before the request settles.
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await axios.post(
        `/api/v1/order/claim`,
        { claimToken, password: pw },
        { withCredentials: true }
      );
      if (!mountedRef.current) return;
      toast.success("Welcome! Your orders are now linked.");
      navigate("/myorders");
    } catch (e) {
      if (!mountedRef.current) return;
      setErr(e.response?.data?.message || "Could not save — try again");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label="Save your details">
      <Stack spacing={2.5}>
        <h3 style={{ margin: 0 }}>Save your details</h3>
        <Field
          label="Password"
          name="password"
          id="claim-password"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          minLength={8}
        />
        {err && (
          <p role="alert" style={{ margin: 0 }}>
            {err}
          </p>
        )}
        <div>
          <PrimaryBtn type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save my details"}
          </PrimaryBtn>
        </div>
      </Stack>
    </form>
  );
}
