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
} from "@mui/material";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { createOrderNumber } from "../../Order/MyOrders";
import SeverityPill from "../../Order/SeverityPill";

function AllOrdersList({ orders, deleteProductHandler }) {
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
                    <Button onClick={() => deleteProductHandler(order._id)}>
                      <DeleteIcon />
                    </Button>
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
