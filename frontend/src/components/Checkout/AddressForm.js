import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Country, State } from "country-state-city";

function AddressForm({ values, handleChange }) {
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
            onChange={(e) => handleChange("firstName", e)}
            defaultValue={values?.firstName}
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
            onChange={(e) => handleChange("lastName", e)}
            defaultValue={values?.lastName}
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
            onChange={(e) => handleChange("address", e)}
            defaultValue={values?.address}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="phone"
            name="phone"
            label="Phone Number"
            fullWidth
            variant="standard"
            onChange={(e) => handleChange("phone", e)}
            defaultValue={values?.phone}
            inputProps={{
              maxLength: 10,
            }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl variant="standard" sx={{ minWidth: 230 }}>
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              id="country"
              onChange={(e) => handleChange("country", e)}
              label="Country"
              defaultValue={values?.country}
            >
              {Country &&
                Country.getAllCountries().map((country) => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl variant="standard" sx={{ minWidth: 230 }}>
            <InputLabel id="state-label">State/Province/Region</InputLabel>
            <Select
              labelId="state-label"
              id="state"
              onChange={(e) => handleChange("state", e)}
              label="State"
              defaultValue={values?.state}
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
            onChange={(e) => handleChange("city", e)}
            defaultValue={values?.city}
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
            onChange={(e) => handleChange("zip", e)}
            defaultValue={values?.zip}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default AddressForm;
