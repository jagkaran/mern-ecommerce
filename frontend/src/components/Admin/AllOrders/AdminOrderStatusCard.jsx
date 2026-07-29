import React from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import { format, parseISO } from "date-fns";
import SeverityPill from "../../Order/SeverityPill";
import { Card, CardBody, Overline } from "../../../design/primitives";

function AdminOrderStatusCard({
  status,
  updateOrderSubmitHandler,
  setOrderStatus,
  orderStatus,
  loading,
  deliveredAt,
}) {
  const currentPillColor =
    (status === "Delivered" && "success") ||
    (status === "Shipped" && "info") ||
    (status === "Processing" && "warning") ||
    "error";

  return (
    <Card>
      <CardBody>
        <Overline>Order Status</Overline>
        <Typography variant="h6" sx={{ marginTop: "8px", marginBottom: "8px" }}>
          Update order status to Shipped or Delivered
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <SeverityPill color={currentPillColor}>{status}</SeverityPill>
          {status === "Delivered" && deliveredAt && (
            <Typography variant="body2" sx={{ color: "var(--t-neutral-500)" }}>
              Delivered at {format(parseISO(deliveredAt), "dd.MM.yyyy HH:mm")}
            </Typography>
          )}
        </Box>

        {status !== "Delivered" && (
          <Box
            component="form"
            onSubmit={updateOrderSubmitHandler}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
              gap: "12px",
              marginTop: "20px",
              alignItems: "flex-end",
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="order-status-select-label">New status</InputLabel>
              <Select
                labelId="order-status-select-label"
                id="order-status-select"
                name="orderStatus"
                label="New status"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {status === "Processing" && (
                  <MenuItem value="Shipped">Shipped</MenuItem>
                )}
                {status === "Shipped" && (
                  <MenuItem value="Delivered">Delivered</MenuItem>
                )}
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              startIcon={<UpgradeIcon />}
              disabled={loading || orderStatus === ""}
              sx={{
                paddingInline: "24px",
                paddingBlock: "10px",
                backgroundColor: "secondary.main",
                whiteSpace: "nowrap",
              }}
            >
              Update
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}

export default AdminOrderStatusCard;