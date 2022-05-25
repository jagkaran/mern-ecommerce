import {
  Box,
  Button,
  Card,
  CardHeader,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { format, parseISO } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { useEffect, useState } from "react";
import { clearErrors, myOrders } from "../../actions/orderAction";
import { useNavigate } from "react-router-dom";
import SeverityPill from "./SeverityPill";
import Seo from "../Seo";
import Copyright from "../Copyright";
import ZeroOrders from "../ZeroOrders";
import "../Cart/Table.css";

//   10 Digit order number prepended by country code
export const createOrderNumber = (id, country) => {
  return country + id.replace(/\D/g, "").substring(0, 8);
};

function MyOrders() {
  const dispatch = useDispatch();
  const alert = useAlert();
  const { loading, error, orders, ordersCount } = useSelector(
    (state) => state.myOrders
  );
  const { user } = useSelector((state) => state.user);
  const [sorting, setSorting] = useState(false);
  const history = useNavigate();
  function sortByDate(a, b) {
    if (a.createdAt < b.createdAt) {
      return 1;
    }
    if (a.createdAt > b.createdAt) {
      return -1;
    }
    return 0;
  }

  const sortedOrderArrayByDate = orders.slice().sort(sortByDate);

  const linkToOrderDetails = (id) => {
    history(`/order/${id}`);
  };

  useEffect(() => {
    if (error) {
      alert.error(error.message);
      dispatch(clearErrors());
    }
    dispatch(myOrders());
  }, [dispatch, error, alert]);

  return (
    <>
      <Seo
        title="My Orders - Click.it store"
        description="My all recent orders placed on Click.it Store."
        path="/myorders"
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : ordersCount !== 0 ? (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title={`My Orders (${ordersCount})`} />
                <Paper className="container" sx={{ boxShadow: "none" }}>
                  <Box sx={{ minWidth: 800 }}>
                    <Table
                      sx={{
                        "& .MuiTableRow-root:hover": {
                          cursor: "pointer",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Order Number</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell sortDirection="desc">
                            <Tooltip
                              enterDelay={300}
                              title="Sort"
                              onClick={() => setSorting((prev) => !prev)}
                            >
                              <TableSortLabel
                                active
                                direction={sorting ? "asc" : "desc"}
                              >
                                Date
                              </TableSortLabel>
                            </Tooltip>
                          </TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders && sorting
                          ? orders.map(
                              ({
                                _id,
                                orderStatus,
                                createdAt,
                                shippingInfo,
                                orderItems,
                                totalPrice,
                              }) => (
                                <TableRow
                                  hover
                                  key={_id}
                                  onClick={() => linkToOrderDetails(_id)}
                                >
                                  <TableCell>
                                    {createOrderNumber(
                                      _id,
                                      shippingInfo.country
                                    )}
                                  </TableCell>
                                  <TableCell>{user.name}</TableCell>
                                  <TableCell>{orderItems.length}</TableCell>
                                  <TableCell>${totalPrice}</TableCell>
                                  <TableCell>
                                    {format(
                                      parseISO(createdAt),
                                      `dd.MM.yyyy HH:mm`
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <SeverityPill
                                      color={
                                        (orderStatus === "Delivered" &&
                                          "success") ||
                                        (orderStatus === "Processing" &&
                                          "warning") ||
                                        (orderStatus === "Shipped" && "info") ||
                                        "error"
                                      }
                                    >
                                      {orderStatus}
                                    </SeverityPill>
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          : sortedOrderArrayByDate.map(
                              ({
                                _id,
                                orderStatus,
                                createdAt,
                                shippingInfo,
                                totalPrice,
                                orderItems,
                              }) => (
                                <TableRow
                                  hover
                                  key={_id}
                                  onClick={() => linkToOrderDetails(_id)}
                                >
                                  <TableCell>
                                    {createOrderNumber(
                                      _id,
                                      shippingInfo.country
                                    )}
                                  </TableCell>
                                  <TableCell>{user.name}</TableCell>
                                  <TableCell>{orderItems.length}</TableCell>
                                  <TableCell>${totalPrice}</TableCell>
                                  <TableCell>
                                    {format(
                                      parseISO(createdAt),
                                      `dd.MM.yyyy HH:mm`
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <SeverityPill
                                      color={
                                        (orderStatus === "Delivered" &&
                                          "success") ||
                                        (orderStatus === "Processing" &&
                                          "warning") ||
                                        (orderStatus === "Shipped" && "info") ||
                                        "error"
                                      }
                                    >
                                      {orderStatus}
                                    </SeverityPill>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    p: 2,
                  }}
                >
                  <Button
                    color="primary"
                    endIcon={<ArrowRightIcon fontSize="small" />}
                    size="small"
                    variant="text"
                  >
                    View all
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      ) : (
        <ZeroOrders />
      )}
      <Copyright />
    </>
  );
}

export default MyOrders;
