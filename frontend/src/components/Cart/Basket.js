import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  SnackbarContent,
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
import CloseIcon from "@mui/icons-material/Close";
import UndoIcon from "@mui/icons-material/Undo";
import { useDispatch, useSelector } from "react-redux";
import { addItemsToCart, removeItemsFromCart } from "../../actions/cartAction";
import EmptyCart from "../EmptyCart";
import { Link } from "react-router-dom";
import Copyright from "../Copyright";
import Seo from "../Seo";
import "./Table.css";
import { useState, useEffect, useRef, useCallback } from "react";

const UNDO_DURATION = 10; // seconds

function Basket() {
  const { cartItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  // Map of productId -> { item, timeoutId, intervalId, secondsLeft }
  const [pendingRemovals, setPendingRemovals] = useState({});

  // We keep a ref so the interval callbacks always see fresh state
  const pendingRef = useRef(pendingRemovals);
  useEffect(() => {
    pendingRef.current = pendingRemovals;
  }, [pendingRemovals]);

  const increaseQty = (id, quantity, stock) => {
    if (stock <= quantity) return;
    dispatch(addItemsToCart(id, quantity + 1));
  };

  const decreaseQty = (id, quantity) => {
    if (1 >= quantity) return;
    dispatch(addItemsToCart(id, quantity - 1));
  };

  // Commit the removal for real
  const commitRemoval = useCallback(
    (productId) => {
      dispatch(removeItemsFromCart(productId));
      setPendingRemovals((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    },
    [dispatch]
  );

  // Called when user clicks the X delete button
  const handleDeleteClick = (item) => {
    const productId = item.product;

    // If there's already a pending removal for this item, skip
    if (pendingRef.current[productId]) return;

    // Countdown interval — updates secondsLeft every second
    const intervalId = setInterval(() => {
      setPendingRemovals((prev) => {
        if (!prev[productId]) return prev;
        const newLeft = prev[productId].secondsLeft - 1;
        if (newLeft <= 0) {
          clearInterval(prev[productId].intervalId);
          return prev; // timeout callback will clean up
        }
        return {
          ...prev,
          [productId]: { ...prev[productId], secondsLeft: newLeft },
        };
      });
    }, 1000);

    // Real removal fires after UNDO_DURATION seconds
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      commitRemoval(productId);
    }, UNDO_DURATION * 1000);

    setPendingRemovals((prev) => ({
      ...prev,
      [productId]: {
        item,
        timeoutId,
        intervalId,
        secondsLeft: UNDO_DURATION,
      },
    }));
  };

  // Called when user clicks Undo
  const handleUndo = (productId) => {
    const entry = pendingRef.current[productId];
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    clearInterval(entry.intervalId);
    setPendingRemovals((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  // Called when user dismisses the snackbar without undoing
  const handleSnackbarClose = (productId) => {
    const entry = pendingRef.current[productId];
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    clearInterval(entry.intervalId);
    commitRemoval(productId);
  };

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingRef.current).forEach(({ timeoutId, intervalId }) => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      });
    };
  }, []);

  // Items currently visible = cart items NOT in the pending-removal queue
  const visibleItems = cartItems.filter(
    (item) => !pendingRemovals[item.product]
  );

  // All items including restored pending ones for total calculations
  const totalItems = cartItems.filter(
    (item) => !pendingRemovals[item.product]
  );

  const pendingList = Object.values(pendingRemovals);

  return (
    <>
      <Seo
        title="Your Shopping Cart - Click.it Store"
        description="Please review your items in cart and proceed to Checkout"
        path="/cart"
      />

      {/* ── Undo Snackbars — one per pending removal ── */}
      {pendingList.map(({ item, secondsLeft }) => (
        <Snackbar
          key={item.product}
          open
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          // Offset multiple snackbars so they don't overlap
          style={{
            bottom:
              16 +
              pendingList.findIndex((e) => e.item.product === item.product) *
                100,
          }}
        >
          <SnackbarContent
            sx={{
              backgroundColor: "#323232",
              minWidth: "340px !important",
              flexDirection: "column",
              p: 0,
              overflow: "hidden",
              borderRadius: 2,
            }}
            message={
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5, width: "100%" }}>
                {/* Row: text + buttons */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#fff", flexShrink: 1, mr: 1 }}
                    noWrap
                  >
                    Removed&nbsp;
                    <strong>{item.name}</strong>
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {/* Countdown badge */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#aaa",
                        minWidth: 24,
                        textAlign: "right",
                      }}
                    >
                      {secondsLeft}s
                    </Typography>

                    {/* Undo */}
                    <Button
                      size="small"
                      startIcon={<UndoIcon fontSize="small" />}
                      onClick={() => handleUndo(item.product)}
                      sx={{
                        color: "#90caf9",
                        fontWeight: 700,
                        textTransform: "none",
                        minWidth: 0,
                        px: 1,
                      }}
                    >
                      Undo
                    </Button>

                    {/* Dismiss — commits immediately */}
                    <IconButton
                      size="small"
                      onClick={() => handleSnackbarClose(item.product)}
                      sx={{ color: "#aaa" }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Progress bar drains over UNDO_DURATION seconds */}
                <LinearProgress
                  variant="determinate"
                  value={(secondsLeft / UNDO_DURATION) * 100}
                  sx={{
                    height: 3,
                    borderRadius: 0,
                    backgroundColor: "#555",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#90caf9",
                      transition: "transform 1s linear",
                    },
                  }}
                />
              </Box>
            }
          />
        </Snackbar>
      ))}

      {/* ── Cart body ── */}
      {visibleItems.length > 0 || pendingList.length > 0 ? (
        totalItems.length > 0 ? (
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              <Grid item lg={12} md={12} xs={12}>
                <Card variant="outlined">
                  <Paper className="container" sx={{ boxShadow: "none" }}>
                    <Box sx={{ alignItems: "center", display: "flex" }}>
                      <CardHeader title="Shopping Cart" />
                      <Typography variant="body1" gutterBottom sx={{ mt: 1 }}>
                        (
                        {totalItems.reduce(
                          (acc, item) => acc + item.quantity,
                          0
                        )}{" "}
                        items)
                      </Typography>
                    </Box>
                    <Divider />
                    <Box mt={2}>
                      <Table
                        sx={{
                          [`& .${tableCellClasses.root}`]: { border: "none" },
                        }}
                      >
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Typography variant="h6" gutterBottom component="div" mr={2}>
                                Product Details
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" gutterBottom component="div" mr={2}>
                                Quantity
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" gutterBottom component="div" mr={2}>
                                SubTotal
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visibleItems.map((item) => (
                            <TableRow key={item.product}>
                              <TableCell>
                                <Box sx={{ alignItems: "center", display: "flex" }}>
                                  <Avatar
                                    src={item.image}
                                    sx={{ mr: 2, width: 90, height: 120 }}
                                    variant="square"
                                  />
                                  <Box>
                                    <Typography color="textPrimary" variant="body1">
                                      {item.name}
                                    </Typography>
                                    <Typography color="textPrimary" variant="body1">
                                      ${item.price}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ alignItems: "center", display: "flex" }}>
                                  <button onClick={() => decreaseQty(item.product, item.quantity)}>
                                    <RemoveCircleOutlineIcon />
                                  </button>
                                  <input
                                    className="border-none ml-4 w-6 outline-none appearance-none font-sans text-gray-800"
                                    value={item.quantity}
                                    type="number"
                                    readOnly
                                  />
                                  <button onClick={() => increaseQty(item.product, item.quantity, item.stock)}>
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
                                <Button onClick={() => handleDeleteClick(item)}>
                                  <ClearIcon />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>

                    {/* Gross Total */}
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
                        {`$${totalItems.reduce(
                          (acc, item) => acc + item.quantity * item.price,
                          0
                        )}`}
                      </Typography>
                    </Box>

                    {/* Checkout */}
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
          // All remaining items are pending removal — show empty state but
          // snackbars are still visible so user can still undo
          <EmptyCart />
        )
      ) : (
        <EmptyCart />
      )}

      <Copyright />
    </>
  );
}

export default Basket;
