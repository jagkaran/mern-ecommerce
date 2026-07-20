import React, { useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useCurrency } from "../../utils/currencyContext";
import { addItemsToCart, removeItemsFromCart } from "../../actions/cartAction";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Headline,
  BodyText,
  Price,
  PrimaryBtn,
  Overline,
  Surface,
  QtyStepper,
  Badge,
  Reveal,
  Divider,
  GhostBtn,
} from "../../design/primitives";
import Seo from "../Seo";
import CouponOffersPanel from "../CouponOffersPanel";

function Basket() {
  const { fmt } = useCurrency();
  const { cartItems, coupon } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const toast = useToast();
  const [productStocks, setProductStocks] = useState({});
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  // Re-fetch stock so the QtyStepper respects the real cap
  useEffect(() => {
    let cancelled = false;
    async function fetchStocks() {
      const stocks = {};
      await Promise.all(
        cartItems.map(async (item) => {
          try {
            const { data } = await axios.get(`/api/v1/product/${item.product}`);
            stocks[item.product] = data.product?.stock ?? 0;
          } catch {
            stocks[item.product] = 0;
          }
        })
      );
      if (!cancelled) setProductStocks(stocks);
    }
    if (cartItems.length) fetchStocks();
    return () => {
      cancelled = true;
    };
  }, [cartItems]);

  const setQty = (id, currentQty, nextQty) => {
    const maxStock = productStocks[id] ?? Infinity;
    if (nextQty > maxStock) {
      toast.info(`Only ${maxStock} in stock`);
      return;
    }
    if (nextQty > currentQty) dispatch(addItemsToCart(id, currentQty + 1));
    else if (nextQty < currentQty) dispatch(addItemsToCart(id, currentQty - 1));
  };

  const handleRemove = (productId, name) => {
    dispatch(removeItemsFromCart(productId));
    toast.success(`Removed ${name}`);
  };

  const totalItemsCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const totalPrice = cartItems.reduce((a, i) => a + i.quantity * i.price, 0);

  // ─── Coupon handlers ───────────────────────────────────────────────────────
  // Coupon validation is server-side via /api/v1/coupon/validate. We send the
  // current subtotal so the API can compute the discount preview. The actual
  // discount is recomputed authoritatively at order creation, never trust
  // client numbers on checkout.
  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      // Send cart context so /validate runs full engine eligibility —
      // prevents applying a coupon that the order service would reject
      // (e.g. minSubtotal not met).
      const categories = [...new Set((cartItems || []).map((i) => i.category).filter(Boolean))];
      const productIds = (cartItems || []).map((i) => i.product).filter(Boolean);
      const { data } = await axios.post("/api/v1/coupon/validate", {
        code,
        itemSubtotal: totalPrice,
        itemCount: totalItemsCount,
        categories,
        productIds,
      });
      if (data.valid) {
        dispatch({ type: "ApplyCoupon", payload: data.coupon });
        toast.success(`Coupon ${data.coupon.code} applied`);
        setCouponInput("");
      } else {
        toast.error(data.message || "Coupon not eligible for this cart");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not validate coupon");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    dispatch({ type: "RemoveCoupon" });
    toast.info("Coupon removed");
  };

  // Re-validate the applied coupon whenever the cart changes. A coupon that
  // met its minSubtotal at apply-time may no longer qualify after the user
  // adjusts quantities — without this check the stale discount would
  // survive in Redux and slip into checkout, where /order/new would then
  // reject it with a confusing 400. Auto-remove and notify.
  useEffect(() => {
    if (!coupon) return;
    let cancelled = false;
    (async () => {
      const categories = [...new Set((cartItems || []).map((i) => i.category).filter(Boolean))];
      const productIds = (cartItems || []).map((i) => i.product).filter(Boolean);
      try {
        const { data } = await axios.post("/api/v1/coupon/validate", {
          code: coupon.code,
          itemSubtotal: totalPrice,
          itemCount: totalItemsCount,
          categories,
          productIds,
        });
        if (cancelled) return;
        if (!data.valid) {
          dispatch({ type: "RemoveCoupon" });
          toast.error(data.message || `${coupon.code} no longer applies`);
        }
      } catch {
        /* network blip — leave the coupon alone, order path will catch it */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalPrice, totalItemsCount, coupon, cartItems, dispatch, toast]);

  // Compute the discount amount for the cart summary. For freeShipping we
  // show "Free shipping" qualitatively — the actual shipping cost will be
  // visible on the shipping step (the server doesn't disclose shipping here).
  const couponDiscount =
    coupon?.discountType === "freeShipping" ? null : (coupon?.discountAmount ?? 0);
  const grandTotal = Math.max(0, totalPrice - (couponDiscount ?? 0));

  // -------- Empty state --------
  if (!cartItems.length) {
    return (
      <>
        <Seo title="Your bag | Hverdag" description="A quiet moment to review." path="/cart" />
        <section style={{ paddingBlock: "var(--t-space-4xl)", minHeight: "60vh" }}>
          <div
            style={{
              maxWidth: "560px",
              marginInline: "auto",
              paddingInline: "var(--t-grid-containerPad)",
              textAlign: "center",
            }}
          >
            <Headline level="2xl" style={{ marginBottom: 16 }}>
              Your bag is empty
            </Headline>
            <BodyText
              lead
              style={{
                color: "var(--t-neutral-500)",
                fontStyle: "italic",
                fontFamily: "var(--t-fontFamily-display)",
                marginBottom: 32,
              }}
            >
              Find something to look after.
            </BodyText>
            <PrimaryBtn component={Link} to="/products">
              Browse the collection
            </PrimaryBtn>
          </div>
        </section>
      </>
    );
  }

  // -------- Populated state --------
  return (
    <>
      <Seo
        title={`Your bag | Hverdag`}
        description={`${totalItemsCount} pieces you're keeping close.`}
        path="/cart"
      />
      <section
        style={{
          backgroundColor: "var(--t-neutral-50)",
          paddingBlock: "var(--t-space-3xl)",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            maxWidth: "var(--t-grid-containerMax)",
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
          }}
        >
          <Overline sx={{ display: "block", mb: 1, color: "var(--t-neutral-500)" }}>Cart</Overline>
          <Headline level="2xl" style={{ marginBottom: 48 }}>
            Your bag{" "}
            <Box
              component="span"
              sx={{
                color: "var(--t-neutral-500)",
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                fontSize: "1.5rem",
                fontWeight: 400,
                ml: 1,
              }}
            >
              ({totalItemsCount} {totalItemsCount === 1 ? "piece" : "pieces"})
            </Box>
          </Headline>

          <div
            className="cart-layout"
            style={{
              display: "grid",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Items list — Adidas-inspired 3-col grid per line */}
            <div>
              {cartItems.map((item, i) => {
                const maxStock = productStocks[item.product] ?? Infinity;
                return (
                  <Reveal key={item.product} delay={i * 40}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "64px 1fr",
                          sm: "72px 1fr auto",
                        },
                        gridTemplateRows: { xs: "auto auto", sm: "auto" },
                        gap: { xs: 2, sm: 3 },
                        alignItems: "center",
                        py: 2.5,
                        borderTop: i === 0 ? "1px solid var(--t-neutral-200)" : "none",
                        borderBottom: "1px solid var(--t-neutral-200)",
                      }}
                    >
                      {/* Col 1: image — left, parallel to name */}
                      <Box
                        sx={{
                          gridRow: { xs: "1 / 3", sm: "1" },
                          gridColumn: "1",
                        }}
                      >
                        <Link
                          to={`/product/${item.product}`}
                          style={{
                            display: "block",
                            width: { xs: 64, sm: 72 },
                            height: { xs: 64, sm: 72 },
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
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                color: "var(--t-neutral-400)",
                                fontSize: 10,
                                p: 1,
                                textAlign: "center",
                              }}
                            >
                              No image
                            </Box>
                          )}
                        </Link>
                      </Box>

                      {/* Col 2: name + size/category (parallel to image) + qty (below) */}
                      <Box sx={{ gridColumn: { xs: "2", sm: "2" }, minWidth: 0 }}>
                        <Link
                          to={`/product/${item.product}`}
                          style={{
                            textDecoration: "none",
                            color: "var(--t-neutral-900)",
                          }}
                        >
                          <Box
                            component="h3"
                            sx={{
                              fontFamily: "var(--t-fontFamily-display)",
                              fontSize: "1.0625rem",
                              fontWeight: 500,
                              color: "var(--t-neutral-900)",
                              letterSpacing: "var(--t-letterSpacing-tight)",
                              lineHeight: 1.3,
                              m: 0,
                              mb: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.name}
                          >
                            {item.name}
                          </Box>
                        </Link>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontSize: "var(--t-fontSize-sm)",
                            color: "var(--t-neutral-500)",
                            mb: 0.5,
                          }}
                        >
                          {item.category && (
                            <Box
                              sx={{
                                fontSize: "var(--t-fontSize-xs)",
                                fontWeight: 500,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "var(--t-neutral-500)",
                              }}
                            >
                              {item.category}
                            </Box>
                          )}
                          {item.category && <Box sx={{ color: "var(--t-neutral-300)" }}>·</Box>}
                          <Box
                            sx={{ fontSize: "var(--t-fontSize-sm)", color: "var(--t-neutral-500)" }}
                          >
                            {fmt(item.price)} each
                          </Box>
                        </Box>
                        {maxStock <= 10 && Number.isFinite(maxStock) && (
                          <Badge variant="warning" sx={{ mt: 0.5, display: "inline-block" }}>
                            Only {maxStock} left
                          </Badge>
                        )}
                      </Box>

                      {/* Col 3 — qty (parallel under name) + price+remove on extreme right */}
                      <Box
                        sx={{
                          gridColumn: { xs: "2", sm: "3" },
                          gridRow: { xs: "2", sm: "1" },
                          display: "flex",
                          flexDirection: { xs: "row", sm: "column" },
                          alignItems: "center",
                          justifyContent: { xs: "flex-start", sm: "flex-end" },
                          gap: { xs: 3, sm: 1 },
                          textAlign: { xs: "left", sm: "right" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <QtyStepper
                            value={item.quantity}
                            min={0}
                            max={Number.isFinite(maxStock) ? maxStock : 99}
                            onChange={(next) => {
                              if (next < 1) handleRemove(item.product, item.name);
                              else setQty(item.product, item.quantity, next);
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Price
                            style={{
                              display: "block",
                              fontSize: "var(--t-fontSize-base)",
                              fontFamily: "var(--t-fontFamily-sans)",
                              fontWeight: 600,
                              color: "var(--t-neutral-900)",
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt(item.price * item.quantity)}
                          </Price>
                          <IconButton
                            onClick={() => handleRemove(item.product, item.name)}
                            aria-label={`Remove ${item.name} from bag`}
                            size="small"
                            sx={{
                              color: "var(--t-neutral-500)",
                              transition:
                                "color var(--t-motion-duration-fast) var(--t-motion-easing-out), background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                              "&:hover": {
                                color: "var(--t-primary-600)",
                                backgroundColor: "var(--t-primary-50)",
                              },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Reveal>
                );
              })}
            </div>

            {/* Summary */}
            <Surface
              sx={{
                position: { lg: "sticky" },
                top: { lg: 88 },
                p: { xs: 3, sm: 4 },
              }}
            >
              <Headline
                level="sm"
                sx={{
                  fontSize: "var(--t-fontSize-lg)",
                  fontFamily: "var(--t-fontFamily-display)",
                  mb: 3,
                }}
              >
                Summary
              </Headline>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  fontSize: "var(--t-fontSize-sm)",
                  color: "var(--t-neutral-600)",
                }}
              >
                <span>Subtotal</span>
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                    color: "var(--t-neutral-900)",
                  }}
                >
                  {fmt(totalPrice)}
                </span>
              </Box>
              <Box
                sx={{
                  fontSize: "var(--t-fontSize-sm)",
                  color: "var(--t-neutral-500)",
                  fontStyle: "italic",
                  mb: 3,
                }}
              >
                Shipping calculated at checkout.
              </Box>

              {/* Coupon block — placed between shipping hint and total so the
                  discount visually reduces the order total. */}
              {coupon ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    px: 1.5,
                    py: 1,
                    borderRadius: "var(--t-border-radius-sm)",
                    backgroundColor: "var(--t-accent-sage-50)",
                    border: "1px solid var(--t-accent-sage-200, #C7D2BC)",
                    fontSize: "var(--t-fontSize-sm)",
                  }}
                >
                  <span style={{ color: "var(--t-accent-sage-600)" }}>
                    {coupon.code}{" "}
                    {coupon.discountType === "freeShipping"
                      ? "· free shipping"
                      : `· ${fmt(coupon.discountAmount)} off`}
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--t-accent-sage-600)",
                      fontSize: "1.1rem",
                      lineHeight: 1,
                      opacity: 0.7,
                    }}
                  >
                    ×
                  </button>
                </Box>
              ) : (
                <>
                  <CouponOffersPanel subtotal={totalPrice} itemCount={totalItemsCount} dense />
                  <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                    <input
                      type="text"
                      name="coupon"
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      autoComplete="off"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 40,
                        padding: "0 12px",
                        border: "1px solid var(--t-neutral-200)",
                        borderRadius: "var(--t-border-radius-base)",
                        fontSize: "var(--t-fontSize-sm)",
                        backgroundColor: "#FFF",
                        color: "var(--t-neutral-900)",
                        fontFamily: "inherit",
                        outline: "none",
                        transition:
                          "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--t-primary-600)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--t-neutral-200)")}
                    />
                    <GhostBtn
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponBusy || !couponInput.trim()}
                    >
                      {couponBusy ? "…" : "Apply"}
                    </GhostBtn>
                  </Box>
                </>
              )}

              <Divider />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  my: 2,
                }}
              >
                <Box
                  sx={{
                    fontSize: "var(--t-fontSize-sm)",
                    fontWeight: 500,
                    color: "var(--t-neutral-900)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Total
                </Box>
                <Price large>{fmt(grandTotal)}</Price>
              </Box>
              <PrimaryBtn component={Link} to="/checkout" sx={{ width: "100%" }}>
                Continue to checkout
              </PrimaryBtn>
              <p
                style={{
                  marginTop: 16,
                  fontSize: "var(--t-fontSize-sm)",
                  color: "var(--t-neutral-500)",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                free mending for life, included
              </p>
            </Surface>
          </div>
        </div>
      </section>
    </>
  );
}

export default Basket;
