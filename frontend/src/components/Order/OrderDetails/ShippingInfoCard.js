import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

function ShippingInfoCard({ name, phone, address }) {
  return (
    <Card>
      <CardHeader
        subheader="Actual address for delivering items"
        title="Shipping Info"
      />
      <Divider />
      <CardContent>
        <Grid container spacing={6} wrap="wrap">
          <Grid
            item
            md={4}
            sm={6}
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
            xs={12}
          >
            <Typography gutterBottom variant="body1">
              Name: {name}
            </Typography>
            <Typography gutterBottom variant="body1">
              Phone: {phone}
            </Typography>
            <Typography gutterBottom variant="body1">
              Address: {address}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ShippingInfoCard;
