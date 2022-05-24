import React from "react";
import { Avatar, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
function OrderItemGrid({ id, name, quantity, price, image }) {
  return (
    <Grid container wrap="wrap">
      <Grid
        item
        md={5}
        sm={6}
        sx={{
          display: "flex",
        }}
        xs={12}
        alignItems="center"
        mt={2}
      >
        <Link to={`/product/${id}`}>
          <Avatar
            src={image}
            sx={{ mr: 4, width: 90, height: 120 }}
            variant="square"
          ></Avatar>
        </Link>
        <Typography color="textPrimary" variant="body1">
          {name}
        </Typography>
      </Grid>
      <Grid
        item
        md={5}
        sm={6}
        sx={{
          display: "flex",
          mt: 3,
        }}
        alignItems="center"
        xs={12}
      >
        <Typography color="textPrimary" gutterBottom variant="body1">
          {quantity} x ${price} =
        </Typography>
        <Typography ml={1} color="textPrimary" gutterBottom variant="body1">
          ${price * quantity}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default OrderItemGrid;
