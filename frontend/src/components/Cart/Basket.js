import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Container,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ClearIcon from "@mui/icons-material/Clear";
import { useDispatch, useSelector } from "react-redux";
import { addItemsToCart, removeItemsFromCart } from "../../actions/cartAction";
import EmptyCart from "../EmptyCart";
import { Link } from "react-router-dom";
import Copyright from "../Copyright";
import Seo from "../Seo";
import "./Table.css";

function Basket() {
  const { cartItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const increaseQty = (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (stock <= quantity) {
      return;
    }
    dispatch(addItemsToCart(id, newQty));
  };

  const decreaseQty = (id, quantity) => {
    const newQty = quantity - 1;
    if (1 >= quantity) {
      return;
    }
    dispatch(addItemsToCart(id, newQty));
  };

  return (
    <>
      <Seo
        title="Your Shopping Cart - Click.it Store"
        description="Please review your items in cart and proceed to Checkout"
        path="/cart"
      />
      {cartItems.length > 0 ? (
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid item lg={12} md={12} xs={12}>
              <Card variant="outlined">
                <Paper className="container" sx={{ boxShadow: "none" }}>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <CardHeader title="Shopping Cart" />
                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{
                        mt: 1,
                      }}
                    >
                      (
                      {cartItems.reduce(
                        (accum, item) => accum + item.quantity,
                        0
                      )}{" "}
                      items)
                    </Typography>
                  </Box>
                  <Divider />
                  <Box mt={2}>
                    <Table
                      sx={{
                        [`& .${tableCellClasses.root}`]: {
                          border: "none",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Typography
                              variant="h6"
                              gutterBottom
                              component="div"
                              mr={2}
                            >
                              Product Details
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="h6"
                              gutterBottom
                              component="div"
                              mr={2}
                            >
                              Quantity
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="h6"
                              gutterBottom
                              component="div"
                              mr={2}
                            >
                              SubTotal
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.product}>
                            <TableCell>
                              <Box
                                sx={{
                                  alignItems: "center",
                                  display: "flex",
                                }}
                              >
                                <Avatar
                                  src={item.image}
                                  sx={{ mr: 2, width: 90, height: 120 }}
                                  variant="square"
                                ></Avatar>
                                <Box>
                                  <Typography
                                    color="textPrimary"
                                    variant="body1"
                                  >
                                    {item.name}
                                  </Typography>
                                  <Typography
                                    color="textPrimary"
                                    variant="body1"
                                  >
                                    ${item.price}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  alignItems: "center",
                                  display: "flex",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    decreaseQty(item.product, item.quantity)
                                  }
                                >
                                  <RemoveCircleOutlineIcon />
                                </button>

                                <input
                                  className="border-none ml-4 w-6 outline-none appearance-none font-sans text-gray-800"
                                  value={item.quantity}
                                  type="number"
                                  readOnly
                                ></input>

                                <button
                                  onClick={() =>
                                    increaseQty(
                                      item.product,
                                      item.quantity,
                                      item.stock
                                    )
                                  }
                                >
                                  <AddCircleOutlineIcon />
                                </button>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography color="textPrimary" variant="body1">
                                {`$${item.price * item.quantity}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() =>
                                  dispatch(removeItemsFromCart(item.product))
                                }
                              >
                                <ClearIcon />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      justifyContent: "flex-end",
                      p: 1,
                      m: 2,
                    }}
                  >
                    <Typography color="textPrimary" variant="h6" mr={3}>
                      Gross Total
                    </Typography>
                    <Typography color="textPrimary" variant="body1" ml={3}>
                      {`$${cartItems.reduce(
                        (accum, item) => accum + item.quantity * item.price,
                        0
                      )}`}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      justifyContent: "flex-end",
                      p: 1,
                      m: 2,
                    }}
                  >
                    <Link to="/signin?redirect=shipping">
                      <Button
                        startIcon={<ArrowForwardIosIcon fontSize="small" />}
                        sx={{ mt: 3 }}
                        variant="contained"
                      >
                        Checkout
                      </Button>
                    </Link>
                  </Box>
                </Paper>
              </Card>
            </Grid>
          </Grid>
        </Container>
      ) : (
        <>
          <EmptyCart />
        </>
      )}
      <Copyright />
    </>
  );
}

export default Basket;
