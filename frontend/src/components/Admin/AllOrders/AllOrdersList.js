import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { createOrderNumber } from "../../Order/MyOrders";
import SeverityPill from "../../Order/SeverityPill";
import { useState } from "react";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";
import { formatPrice } from "../../../utils/fmt";

/**
 * TABLE_SX — applied to <Table> itself.
 * Resets MUI's internal cell padding and re-applies it uniformly
 * via the `.MuiTableCell-root` override so EVERY cell (head + body)
 * gets exactly the same spacing regardless of the theme default.
 */
const TABLE_SX = {
  "& .MuiTableCell-root": {
    px: 3,
    py: 1.75,
    fontSize: "0.875rem",
    borderBottom: "1px solid",
    borderColor: "divider",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    fontWeight: 600,
    color: "text.secondary",
    bgcolor: "background.default",
  },
};

function AllOrdersList({ orders, deleteOrderHandler }) {
  const [open, setOpen]               = useState(false);
  const [selectedOrder, setSelectedOrder] = useState({});

  const { page, perPage, totalPages, paginated, setPage, setPerPage } =
    useAdminPagination(orders, 10);

  const handleClickOpen = (order) => { setOpen(true); setSelectedOrder(order); };
  const handleClose     = () => setOpen(false);

  const deleteOrder = (id) => {
    deleteOrderHandler(id);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader title={`All Orders (${orders.length})`} />
      <Divider />

      <PerfectScrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table size="medium" sx={TABLE_SX}>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Items Qty</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((order) => (
                <TableRow hover key={order._id}>
                  <TableCell>
                    {createOrderNumber(order._id, order.shippingInfo?.country)}
                  </TableCell>
                  <TableCell>
                    <SeverityPill
                      color={
                        (order.orderStatus === "Delivered" && "success") ||
                        (order.orderStatus === "Shipped"   && "info")    ||
                        (order.orderStatus === "Processing" && "warning") ||
                        "error"
                      }
                    >
                      {order.orderStatus}
                    </SeverityPill>
                  </TableCell>
                  <TableCell>{order.orderItems.length}</TableCell>
                  <TableCell>${formatPrice(order.totalPrice)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Link to={`/admin/order/update/${order._id}`}>
                        <EditIcon fontSize="small" />
                      </Link>
                      <Button
                        size="small"
                        onClick={() => handleClickOpen(order)}
                        sx={{ minWidth: 0, p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Box>

                    <Dialog
                      open={open && selectedOrder._id === order._id}
                      onClose={handleClose}
                      aria-labelledby="order-delete-title"
                    >
                      <DialogTitle id="order-delete-title">Delete Confirmation</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          Are you sure you want to delete &ldquo;{
                            createOrderNumber(selectedOrder._id, selectedOrder.shippingInfo?.country)
                          }&rdquo; order?
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClose} color="primary">Cancel</Button>
                        <Button onClick={() => deleteOrder(selectedOrder._id)} color="error">
                          Delete
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>

      <Divider />

      {/* Pagination footer */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 3, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <Select
            size="small"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            sx={{ fontSize: "0.875rem" }}
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {Math.min((page - 1) * perPage + 1, orders.length)}–
            {Math.min(page * perPage, orders.length)} of {orders.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            size="small"
          />
        </Stack>
      </Stack>
    </Card>
  );
}

export default AllOrdersList;
