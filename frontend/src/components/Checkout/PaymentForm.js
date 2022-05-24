import React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import StripeCardNumberInput from "./StripeCardNumberInput";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js";
import StripeCardExpInput from "./StripeCardExpInput";
import StripeCardCVCInput from "./StripeCardCVCInput";

function PaymentForm() {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Payment method
      </Typography>
      <Typography variant="caption" display="block" gutterBottom color="red">
        This App is in testing mode, use '4242424242424242' as a card number,
        Expiry and CVC of your choice
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} mt={2}>
          <TextField
            required
            id="cardNumber"
            name="cardNumber"
            label="Credit/Debit Card Number"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              inputComponent: StripeCardNumberInput,
              inputProps: {
                component: CardNumberElement,
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={3} mt={2}>
          <TextField
            required
            id="cardExp"
            name="cardExp"
            label="Card Expiry Date"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              inputComponent: StripeCardExpInput,
              inputProps: {
                component: CardExpiryElement,
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={3} mt={2} mb={2}>
          <TextField
            required
            id="cardCvc"
            name="cardCvc"
            label="Card CVC"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              inputComponent: StripeCardCVCInput,
              inputProps: {
                component: CardCvcElement,
              },
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default PaymentForm;
