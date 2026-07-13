import React, { useState } from "react";
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

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post(
        `/api/v1/order/claim`,
        { claimToken, password: pw },
        { withCredentials: true }
      );
      toast.success("Welcome! Your orders are now linked.");
      navigate("/orders");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label="Save your details">
      <h3>Save your details</h3>
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
      {err && <p role="alert">{err}</p>}
      <PrimaryBtn type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save my details"}
      </PrimaryBtn>
    </form>
  );
}