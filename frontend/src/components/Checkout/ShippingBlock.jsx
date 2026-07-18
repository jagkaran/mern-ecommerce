import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { MenuItem, Stack } from "@mui/material";
import { setField, setError, setTouched } from "../../slices/checkoutSlice";
import { validatePostal, validatePhone } from "../../utils/checkoutValidators";
import { Surface, SurfaceHeader, Field, FieldRow } from "../../design/primitives";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
];

export default function ShippingBlock() {
  const dispatch = useDispatch();
  const checkout = useSelector((s) => s.checkout);
  const { name, address1, address2, city, state, postal, country, phone, touched, errors } =
    checkout;

  const onText = (key) => (e) => dispatch(setField({ name: key, value: e.target.value }));
  const blurPostal = () => {
    dispatch(setTouched("postal"));
    dispatch(setError({ name: "postal", message: validatePostal(postal, country) }));
  };
  const blurPhone = () => {
    dispatch(setTouched("phone"));
    dispatch(setError({ name: "phone", message: validatePhone(phone) }));
  };
  const blurCountry = () => {
    dispatch(setTouched("country"));
    dispatch(setError({ name: "postal", message: validatePostal(postal, country) }));
  };

  return (
    <Surface aria-label="Shipping" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <SurfaceHeader title="Shipping" subtitle="Where should we send your order?" />

      <Stack spacing={2.5}>
        <Field
          id="co-name"
          name="fullName"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={onText("name")}
          error={touched.name ? errors.name : undefined}
          fullWidth
        />

        <FieldRow columns={{ xs: 1, sm: 1 }}>
          <Field
            id="co-country"
            name="country"
            label="Country"
            select
            autoComplete="country"
            value={country}
            onChange={onText("country")}
            onBlur={blurCountry}
            fullWidth
          >
            {COUNTRIES.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.label}
              </MenuItem>
            ))}
          </Field>
        </FieldRow>

        <Field
          id="co-addr1"
          name="address1"
          label="Address line 1"
          autoComplete="address-line1"
          value={address1}
          onChange={onText("address1")}
          error={touched.address1 ? errors.address1 : undefined}
          fullWidth
        />

        <Field
          id="co-addr2"
          name="address2"
          label="Address line 2 (optional)"
          autoComplete="address-line2"
          value={address2}
          onChange={onText("address2")}
          fullWidth
        />

        <FieldRow columns={{ xs: 1, sm: 2 }}>
          <Field
            id="co-city"
            name="city"
            label="City"
            autoComplete="address-level2"
            value={city}
            onChange={onText("city")}
            error={touched.city ? errors.city : undefined}
            fullWidth
          />
          <Field
            id="co-state"
            name="state"
            label="State / Region"
            autoComplete="address-level1"
            value={state}
            onChange={onText("state")}
            fullWidth
          />
        </FieldRow>

        <FieldRow columns={{ xs: 1, sm: 2 }}>
          <Field
            id="co-postal"
            name="postal"
            label="Postal / Zip code"
            autoComplete="postal-code"
            value={postal}
            onChange={onText("postal")}
            onBlur={blurPostal}
            error={touched.postal ? errors.postal : undefined}
            fullWidth
          />
          <Field
            id="co-phone"
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={onText("phone")}
            onBlur={blurPhone}
            error={touched.phone ? errors.phone : undefined}
            fullWidth
          />
        </FieldRow>
      </Stack>
    </Surface>
  );
}
