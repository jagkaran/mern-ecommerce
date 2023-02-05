import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Box,
  Button,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

function AllOrdersList(props) {
  const [open, setOpen] = useState(false);
  const { orders, deleteOrderHandler } = props;
  const [selectedOrder, setSelectedOrder] = useState({});

  const handleClickOpen = (order) => {
    setOpen(true);
    setSelectedOrder(order);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteOrder = (id) => {
    deleteOrderHandler(id);
    setOpen(false);
  };
  return (
    <Card>
      <CardHeader title={`All Orders (${orders.length})`} />
      <PerfectScrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Items Quantity</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow hover key={order._id}>
                  <TableCell>
                    {createOrderNumber(order._id, order.shippingInfo.country)}
                  </TableCell>
                  <TableCell>
                    <SeverityPill
                      color={
                        (order.orderStatus === "Delivered" && "success") ||
                        (order.orderStatus === "Shipped" && "info") ||
                        (order.orderStatus === "Processing" && "warning") ||
                        "error"
                      }
                    >
                      {order.orderStatus}
                    </SeverityPill>
                  </TableCell>
                  <TableCell>{order.orderItems.length}</TableCell>
                  <TableCell>${order.totalPrice}</TableCell>
                  <TableCell>
                    {" "}
                    <Link to={`/admin/order/update/${order._id}`}>
                      <EditIcon />
                    </Link>
                    {/* <Button onClick={() => deleteProductHandler(order._id)}> */}
                    <Button onClick={() => handleClickOpen(order)}>
                      <DeleteIcon />
                    </Button>
                    <Dialog
                      open={open}
                      onClose={handleClose}
                      aria-labelledby="alert-dialog-title"
                      aria-describedby="alert-dialog-description"
                    >
                      <DialogTitle id="alert-dialog-title">
                        {"Delete Confirmation"}
                      </DialogTitle>
                      <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                          Are you sure you want to delete "
                          {createOrderNumber(
                            selectedOrder._id,
                            selectedOrder.shippingInfo &&
                              selectedOrder.shippingInfo.country
                          )}
                          " order?
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClose} color="primary">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => deleteOrder(selectedOrder._id)}
                          color="secondary"
                        >
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
    </Card>
  );
}

export default AllOrdersList;
