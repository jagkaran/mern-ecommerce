import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  SwipeableDrawer,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCurrency } from "../utils/currencyContext";
import { useLenisStop } from "../utils/lenis";
import { useMiniCart } from "../utils/miniCartContext";
import {
  Headline,
  BodyText,
  Price,
  PrimaryBtn,
  GhostBtn,
  Overline,
  QtyStepper,
  Badge,
} from "../design/primitives";
import { addItemsToCart, removeItemsFromCart } from "../actions/cartAction";
import { useToast } from "../hooks/useToast";

// Condensed cart view — opened from header cart icon. Reuses Redux cart
// state so it stays in sync with /cart (Basket) page. Editing qty here
// updates the same state Basket reads.
export default function MiniCartDrawer() {
  const { fmt } = useCurrency();
  const { open, closeCart } = useMiniCart();
  useLenisStop(open);
  const dispatch = useDispatch();
  const toast = useToast();
  const cartItems = useSelector((s) => s.cart.cartItems);
  const coupon = useSelector((s) => s.cart.coupon);

  const totalCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const subtotal = cartItems.reduce((a, i) => a + i.quantity * i.price, 0);
  const discount =
    coupon?.discountType === "freeShipping" ? null : (coupon?.discountAmount ?? 0);
  const grandTotal = Math.max(0, subtotal - (discount ?? 0));

  const handleQty = (item, next) => {
    if (next < 1) {
      dispatch(removeItemsFromCart(item.product));
      toast.success(`Removed ${item.name}`);
      return;
    }
    dispatch(addItemsToCart(item.product, next));
  };

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={closeCart}
      onOpen={() => {}}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100vw", sm: 380 },
            maxWidth: "100vw",
            backgroundColor: "var(--t-neutral-50)",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: "1px solid var(--t-neutral-200)",
            flexShrink: 0,
          }}
        >
          <Box>
            <Overline sx={{ color: "var(--t-neutral-500)" }}>Cart</Overline>
            <Headline
              level="sm"
              sx={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "1.25rem",
                mt: 0.25,
              }}
            >
              Your bag{" "}
              {totalCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    color: "var(--t-neutral-500)",
                    fontStyle: "italic",
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    ml: 0.5,
                  }}
                >
                  ({totalCount})
                </Box>
              )}
            </Headline>
          </Box>
          <IconButton onClick={closeCart} aria-label="Close cart drawer" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body — scrollable line items */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
          {cartItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <BodyText
                sx={{
                  color: "var(--t-neutral-500)",
                  fontStyle: "italic",
                  fontFamily: "var(--t-fontFamily-display)",
                  mb: 3,
                }}
              >
                Your bag is empty.
              </BodyText>
              <GhostBtn component={Link} to="/products" onClick={closeCart}>
                Browse the collection
              </GhostBtn>
            </Box>
          ) : (
            cartItems.map((item) => (
              <Box
                key={item.product}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  gap: 2,
                  py: 2,
                  borderBottom: "1px solid var(--t-neutral-200)",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Link
                  to={`/product/${item.product}`}
                  onClick={closeCart}
                  style={{
                    display: "block",
                    width: 64,
                    height: 64,
                    background: "var(--t-neutral-100)",
                    borderRadius: "var(--t-border-radius-base)",
                    border: "1px solid var(--t-neutral-200)",
                    overflow: "hidden",
                  }}
                >
                  {item.image ? (
                    <img
                      alt={item.name}
                      src={item.image}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : null}
                </Link>
                <Box sx={{ minWidth: 0 }}>
                  <Link
                    to={`/product/${item.product}`}
                    onClick={closeCart}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      sx={{
                        fontFamily: "var(--t-fontFamily-display)",
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--t-neutral-900)",
                        lineHeight: 1.3,
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </Box>
                  </Link>
                  <BodyText small sx={{ color: "var(--t-neutral-500)", mb: 0.5 }}>
                    {fmt(item.price)} each
                  </BodyText>
                  <QtyStepper
                    value={item.quantity}
                    min={0}
                    max={item.stock || 99}
                    onChange={(next) => handleQty(item, next)}
                    ariaLabel={`Quantity of ${item.name}`}
                  />
                </Box>
                <Price
                  style={{
                    fontSize: "var(--t-fontSize-sm)",
                    fontFamily: "var(--t-fontFamily-sans)",
                    fontWeight: 600,
                    color: "var(--t-neutral-900)",
                    fontVariantNumeric: "tabular-nums",
                    alignSelf: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmt(item.price * item.quantity)}
                </Price>
              </Box>
            ))
          )}
        </Box>

        {/* Footer — totals + CTAs (sticky bottom) */}
        {cartItems.length > 0 && (
          <Box
            sx={{
              borderTop: "1px solid var(--t-neutral-200)",
              px: 3,
              py: 2,
              flexShrink: 0,
              backgroundColor: "var(--t-neutral-50)",
            }}
          >
            {coupon && (
              <Box sx={{ mb: 1.5 }}>
                <Badge variant="success">
                  {coupon.code} applied ·{" "}
                  {coupon.discountType === "freeShipping"
                    ? "free shipping"
                    : `${fmt(discount)} off`}
                </Badge>
              </Box>
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <BodyText small sx={{ color: "var(--t-neutral-600)" }}>
                Subtotal
              </BodyText>
              <Price
                style={{
                  fontSize: "var(--t-fontSize-base)",
                  fontWeight: 500,
                  color: "var(--t-neutral-900)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(grandTotal)}
              </Price>
            </Box>
            <BodyText
              small
              sx={{
                color: "var(--t-neutral-500)",
                fontStyle: "italic",
                mb: 2,
              }}
            >
              Shipping calculated at checkout.
            </BodyText>
            <Box sx={{ display: "flex", gap: 1 }}>
              <GhostBtn
                component={Link}
                to="/cart"
                onClick={closeCart}
                sx={{ flex: 1 }}
              >
                View bag
              </GhostBtn>
              <PrimaryBtn
                component={Link}
                to="/checkout"
                onClick={closeCart}
                sx={{ flex: 1 }}
              >
                Checkout
              </PrimaryBtn>
            </Box>
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
}
