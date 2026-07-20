import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import SeverityPill from "../../Order/SeverityPill";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import { format, parseISO } from "date-fns";

function AdminOrderStatusCard({
  status,
  updateOrderSubmitHandler,
  setOrderStatus,
  orderStatus,
  loading,
  deliveredAt,
}) {
  return (
    <Card>
      <CardHeader
        subheader="Update order status to Shipped or Deliverd"
        title="Order Status"
      />
      <Divider />
      <CardContent>
        <form onSubmit={updateOrderSubmitHandler}>
          <Grid container spacing={6} wrap="wrap">
            <Grid
              item
              md={4}
              sm={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              xs={12}
            >
              <Typography gutterBottom variant="body1">
                <SeverityPill
                  color={
                    (status === "Delivered" && "success") ||
                    (status === "Shipped" && "info") ||
                    (status === "Processing" && "warning") ||
                    "error"
                  }
                >
                  {status}
                </SeverityPill>
                {status === "Delivered" &&
                  ` at ${format(parseISO(deliveredAt), `dd.MM.yyyy HH:mm`)}`}
              </Typography>
            </Grid>

            <Grid
              item
              md={4}
              sm={6}
              sx={{
                display: status === "Delivered" ? "none" : "flex",
              }}
              xs={12}
            >
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Order Status
                </InputLabel>
                <Select
                  labelId="order-status-select-label"
                  id="order-status-select"
                  name="orderStatus"
                  label="Select Order Status"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {status === "Processing" && (
                    <MenuItem value="Shipped">
                      <span className="capitalize">shipped</span>
                    </MenuItem>
                  )}

                  {status === "Shipped" && (
                    <MenuItem value="Delivered">
                      <span className="capitalize">delivered</span>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="outlined"
                sx={{ ml: 3 }}
                startIcon={<UpgradeIcon />}
                disabled={
                  loading ? true : false || orderStatus === "" ? true : false
                }
              >
                Update
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}

export default AdminOrderStatusCard;
