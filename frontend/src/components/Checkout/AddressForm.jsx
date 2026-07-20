import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { FormControl, InputLabel, MenuItem, Select, FormHelperText } from "@mui/material";
import { Country, State } from "country-state-city";

function AddressForm({ values, errors = {}, touched = {}, handleChange }) {
  const fieldProps = (name) => ({
    error: Boolean(touched[name] && errors[name]),
    helperText: touched[name] && errors[name] ? errors[name] : " ",
  });

  // Best-effort city/state autofill via the backend Zippopotam proxy.
  // Silent on failure — the user can still type city/state manually.
  const handleZipBlur = async (e) => {
    const zip = (e.target.value || "").trim();
    const country = values?.country;
    if (!zip || !country || !/^[A-Za-z0-9 -]{1,10}$/.test(zip)) return;
    try {
      const res = await fetch(
        `/api/v1/geo/postal/${encodeURIComponent(country)}/${encodeURIComponent(zip)}`
      );
      if (!res.ok) return;
      const body = await res.json();
      if (body?.hit && body.city && !values?.city) {
        handleChange("city", { target: { name: "city", value: body.city } });
      }
      if (body?.hit && body.country && !values?.state) {
        // Zippopotam returns ISO country code in `body.country`; if state is
        // empty we still prefer keeping the country (helps for stateless countries).
        handleChange("state", { target: { name: "state", value: body.state || body.country } });
      }
    } catch {
      /* autofill is a progressive enhancement */
    }
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Shipping address
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="firstName"
            name="firstName"
            label="First name"
            fullWidth
            autoComplete="given-name"
            variant="standard"
            value={values?.firstName || ""}
            onChange={(e) => handleChange("firstName", e)}
            {...fieldProps("firstName")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="lastName"
            name="lastName"
            label="Last name"
            fullWidth
            autoComplete="family-name"
            variant="standard"
            value={values?.lastName || ""}
            onChange={(e) => handleChange("lastName", e)}
            {...fieldProps("lastName")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="address"
            name="address"
            label="Address"
            fullWidth
            autoComplete="shipping address-line1"
            variant="standard"
            value={values?.address || ""}
            onChange={(e) => handleChange("address", e)}
            {...fieldProps("address")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="phone"
            name="phone"
            label="Phone Number"
            fullWidth
            variant="standard"
            value={values?.phone || ""}
            onChange={(e) => handleChange("phone", e)}
            inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
            {...fieldProps("phone")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl
            variant="standard"
            sx={{ minWidth: 230 }}
            required
            error={Boolean(touched["country"] && errors["country"])}
          >
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              id="country"
              value={values?.country || ""}
              onChange={(e) => handleChange("country", e)}
              label="Country"
            >
              {Country.getAllCountries().map((country) => (
                <MenuItem key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </MenuItem>
              ))}
            </Select>
            {touched["country"] && errors["country"] && (
              <FormHelperText>{errors["country"]}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl variant="standard" sx={{ minWidth: 230 }}>
            <InputLabel id="state-label">State / Province / Region</InputLabel>
            <Select
              labelId="state-label"
              id="state"
              value={values?.state || ""}
              onChange={(e) => handleChange("state", e)}
              label="State"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {values?.country &&
                State.getStatesOfCountry(values?.country).map((state) => (
                  <MenuItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="city"
            name="city"
            label="City"
            fullWidth
            autoComplete="shipping address-level2"
            variant="standard"
            value={values?.city || ""}
            onChange={(e) => handleChange("city", e)}
            {...fieldProps("city")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="zip"
            name="zip"
            label="Zip / Postal code"
            fullWidth
            autoComplete="shipping postal-code"
            variant="standard"
            value={values?.zip || ""}
            onChange={(e) => handleChange("zip", e)}
            onBlur={handleZipBlur}
            {...fieldProps("zip")}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default AddressForm;
