import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setField, setError, setTouched } from "../../slices/checkoutSlice";
import { validatePostal, validatePhone } from "../../utils/checkoutValidators";

export default function ShippingBlock() {
  const dispatch = useDispatch();
  const checkout = useSelector((s) => s.checkout);
  const { name, address1, address2, city, state, postal, country, phone, touched, errors } =
    checkout;

  const onText = (key) => (e) => dispatch(setField({ name: key, value: e.target.value }));
  const blurText = (key, validator) => () => {
    dispatch(setTouched(key));
    const value = checkout[key];
    dispatch(setError({ name: key, message: validator ? validator(value) : null }));
  };
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
    <section aria-label="Shipping">
      <h2>1 · Shipping</h2>

      <label htmlFor="co-name">Full name</label>
      <input
        id="co-name"
        name="fullName"
        autoComplete="name"
        value={name}
        onChange={onText("name")}
        aria-invalid={!!(touched.name && errors.name)}
      />

      <label htmlFor="co-country">Country</label>
      <select
        id="co-country"
        name="country"
        autoComplete="country"
        value={country}
        onChange={onText("country")}
        onBlur={blurCountry}
      >
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="GB">United Kingdom</option>
        <option value="IN">India</option>
        <option value="DE">Germany</option>
        <option value="FR">France</option>
      </select>

      <label htmlFor="co-addr1">Address line 1</label>
      <input
        id="co-addr1"
        name="address1"
        autoComplete="address-line1"
        value={address1}
        onChange={onText("address1")}
        aria-invalid={!!(touched.address1 && errors.address1)}
      />

      <label htmlFor="co-addr2">Address line 2 (optional)</label>
      <input
        id="co-addr2"
        name="address2"
        autoComplete="address-line2"
        value={address2}
        onChange={onText("address2")}
      />

      <label htmlFor="co-city">City</label>
      <input
        id="co-city"
        name="city"
        autoComplete="address-level2"
        value={city}
        onChange={onText("city")}
        aria-invalid={!!(touched.city && errors.city)}
      />

      <label htmlFor="co-state">State / Region</label>
      <input
        id="co-state"
        name="state"
        autoComplete="address-level1"
        value={state}
        onChange={onText("state")}
      />

      <label htmlFor="co-postal">Postal / Zip code</label>
      <input
        id="co-postal"
        name="postal"
        autoComplete="postal-code"
        value={postal}
        onChange={onText("postal")}
        onBlur={blurPostal}
        aria-invalid={!!(touched.postal && errors.postal)}
      />
      {touched.postal && errors.postal && <p role="alert">{errors.postal}</p>}

      <label htmlFor="co-phone">Phone</label>
      <input
        id="co-phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={onText("phone")}
        onBlur={blurPhone}
        aria-invalid={!!(touched.phone && errors.phone)}
      />
      {touched.phone && errors.phone && <p role="alert">{errors.phone}</p>}
    </section>
  );
}