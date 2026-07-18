import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Stack } from "@mui/material";
import { setField, setError, setTouched, setGuest } from "../../slices/checkoutSlice";
import { validateEmail } from "../../utils/checkoutValidators";
import { Surface, SurfaceHeader, Field, PrimaryBtn, GhostBtn } from "../../design/primitives";

export default function ContactBlock({ signedIn }) {
  const dispatch = useDispatch();
  const { email, touched, errors, isGuest } = useSelector((s) => s.checkout);
  const userEmail = useSelector((s) => s.user?.user?.email);

  // Prefill receipt email from logged-in user; user can still edit.
  useEffect(() => {
    if (signedIn && userEmail && !email) {
      dispatch(setField({ name: "email", value: userEmail }));
    }
  }, [signedIn, userEmail, email, dispatch]);

  const onEmail = (e) => dispatch(setField({ name: "email", value: e.target.value }));
  const onBlur = () => {
    dispatch(setTouched("email"));
    dispatch(setError({ name: "email", message: validateEmail(email) }));
  };

  return (
    <Surface aria-label="Contact" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <SurfaceHeader
        title="Contact"
        subtitle={
          signedIn
            ? "We'll send your receipt to the email on your account."
            : "Where should we send your receipt?"
        }
      />

      <Stack spacing={2.5}>
        <Field
          id="co-email"
          name="email"
          type="email"
          label="Email for receipt"
          autoComplete="email"
          value={email}
          onChange={onEmail}
          onBlur={onBlur}
          error={touched.email ? errors.email : undefined}
          fullWidth
        />

        {!signedIn && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", pt: 0.5 }}>
            <PrimaryBtn
              onClick={() => dispatch(setGuest(true))}
              aria-pressed={!!isGuest}
              sx={{ minHeight: 44 }}
            >
              Continue as Guest
            </PrimaryBtn>
            <GhostBtn component="a" href="/signin?redirect=/checkout" sx={{ minHeight: 44 }}>
              or sign in for faster checkout
            </GhostBtn>
          </Box>
        )}
      </Stack>
    </Surface>
  );
}
