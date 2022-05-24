import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import SeverityPill from "../SeverityPill";

function PaymentInfoCard({ status, amount, tax }) {
  return (
    <Card>
      <CardHeader
        subheader="To check if the payment has been processed successfully"
        title="Payment Info"
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
              <SeverityPill
                color={status === "succeeded" ? "success" : "error"}
              >
                {status === "succeeded" ? "PAID" : "NOT PAID"}
              </SeverityPill>
            </Typography>
            <Typography mt={1} gutterBottom variant="body1">
              Amount: ${amount} (Incl. ${tax} Tax)
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default PaymentInfoCard;
