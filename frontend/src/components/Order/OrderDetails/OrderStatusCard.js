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
import { format, parseISO } from "date-fns";

function OrderStatusCard({ status, deliveredAt }) {
  return (
    <Card>
      <CardHeader
        subheader="To check if the order has been dispatched"
        title="Order Status"
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
                color={
                  (status === "Delivered" && "success") ||
                  (status === "Processing" && "warning") ||
                  (status === "Shipped" && "info") ||
                  "error"
                }
              >
                {status}{" "}
              </SeverityPill>
              {status === "Delivered" &&
                ` at ${format(parseISO(deliveredAt), `dd.MM.yyyy HH:mm`)}`}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OrderStatusCard;
