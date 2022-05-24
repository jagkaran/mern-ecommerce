import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import { useSelector } from "react-redux";
import { Avatar } from "@mui/material";
import { Country, State } from "country-state-city";

function ReviewOrder({ reviewData, handleReviewDataChange }) {
  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
  const country = Country.getCountryByCode(shippingInfo.country);
  const state = State.getStateByCodeAndCountry(
    shippingInfo.state,
    shippingInfo.country
  );
  const addresses = [
    shippingInfo.address,
    shippingInfo.city,
    state?.name,
    shippingInfo.zip,
    country.name,
  ];

  reviewData.subTotal = cartItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  reviewData.shippingCharges = reviewData.subTotal > 1000 ? 0 : 50;

  reviewData.tax = reviewData.subTotal * 0.15;

  reviewData.totalPrice =
    reviewData.subTotal + reviewData.shippingCharges + reviewData.tax;

  useEffect(() => {
    if (reviewData?.subTotal !== "") {
      handleReviewDataChange("subTotal", reviewData.subTotal);
    }
    if (reviewData?.shippingCharges !== "") {
      handleReviewDataChange("shippingCharges", reviewData.shippingCharges);
    }
    if (reviewData?.tax !== "") {
      handleReviewDataChange("tax", reviewData.tax);
    }
    if (reviewData?.totalPrice !== "") {
      handleReviewDataChange("totalPrice", reviewData.totalPrice);
    }
  }, [
    reviewData.subTotal,
    reviewData.shippingCharges,
    reviewData.tax,
    reviewData.totalPrice,
  ]);

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Order Summary
      </Typography>
      <List disablePadding>
        {cartItems.map((product) => (
          <ListItem key={product.product} sx={{ py: 1, px: 0 }}>
            <Avatar
              src={product.image}
              sx={{ mr: 2, width: 90, height: 120 }}
              variant="square"
            ></Avatar>
            <ListItemText
              primary={product.name}
              secondary={`Quantity: ${product.quantity}`}
            />

            <Typography variant="body2">
              {product.price} X {product.quantity} ={" "}
              {product.price * product.quantity}
            </Typography>
          </ListItem>
        ))}
        <ListItem sx={{ mt: 3, py: 1, px: 0 }}>
          <ListItemText primary="Sub Total" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ${reviewData.subTotal}
          </Typography>
        </ListItem>
        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Shipping Charges" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {reviewData.shippingCharges === 0
              ? "Free"
              : `$${reviewData.shippingCharges}`}
          </Typography>
        </ListItem>
        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Tax" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ${reviewData.tax}
          </Typography>
        </ListItem>
        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Total" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ${reviewData.totalPrice}
          </Typography>
        </ListItem>
      </List>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Shipping Details
          </Typography>
          <Typography gutterBottom>
            <span>
              <b>Name:</b>
            </span>{" "}
            {shippingInfo.firstName} {shippingInfo.lastName}
          </Typography>
          <Typography gutterBottom>
            <span>
              <b>Phone No: </b>
            </span>{" "}
            {shippingInfo.phone}
          </Typography>
          <Typography gutterBottom>
            <span>
              <b>Shipping Address: </b>
            </span>{" "}
            {addresses.join(", ")}
          </Typography>
        </Grid>
      </Grid>
    </div>
  );
}

export default ReviewOrder;
