import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Box } from "@mui/material";
import { setField, setError, setTouched, setGuest } from "../../slices/checkoutSlice";
import { validateEmail } from "../../utils/checkoutValidators";

export default function ContactBlock({ signedIn }) {
  const dispatch = useDispatch();
  const { email, touched, errors, isGuest } = useSelector((s) => s.checkout);

  const onEmail = (e) => dispatch(setField({ name: "email", value: e.target.value }));
  const onBlur = () => {
    dispatch(setTouched("email"));
    dispatch(setError({ name: "email", message: validateEmail(email) }));
  };

  return (
    <section aria-label="Contact">
      <h2>0 · Contact</h2>
      <label htmlFor="co-email">Email for receipt</label>
      <input
        id="co-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={onEmail}
        onBlur={onBlur}
        aria-invalid={!!(touched.email && errors.email)}
      />
      {touched.email && errors.email && <p role="alert">{errors.email}</p>}
      {!signedIn && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            onClick={() => dispatch(setGuest(true))}
            aria-pressed={!!isGuest}
          >
            Continue as Guest
          </Button>
          <Button variant="text" component="a" href="/signin?redirect=/checkout">
            or sign in for faster checkout
          </Button>
        </Box>
      )}
    </section>
  );
}