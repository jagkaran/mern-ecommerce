// CouponOffersPanel.jsx
// Side-by-side offers preview for the cart + checkout. Fetches the engine-
// filtered list of available coupons for the current cart and renders each
// as a one-click apply. The "auto-apply best deal" CTA hits /best-deal and
// dispatches ApplyCoupon in one round-trip.
//
// Cheap: the backend caches /available for 60s, so this is no extra DB load
// per render.

import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../hooks/useToast";
import { useCurrency } from "../utils/currencyContext";
import { getAvailableCoupons, getBestDeal } from "../actions/couponAction";
import { BodyText, GhostBtn, Overline } from "../design/primitives";

function describeOffer(offer) {
  if (offer.freeShipping) return "Free shipping";
  if (offer.discountType === "percentage") return `${offer.discountValue}% off`;
  if (offer.discountType === "flat") return `$${offer.discountValue} off`;
  if (offer.discountType === "tiered") return "Tiered discount";
  if (offer.discountType === "bogo") return "Buy N get M";
  return offer.discountType;
}

export default function CouponOffersPanel({ subtotal = 0, itemCount = 0, dense = false }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { fmt } = useCurrency();
  // The coupon reducer may be absent in test stores — guard so the panel
  // renders nothing rather than crashing on undefined.
  const couponState = useSelector((s) => s?.coupon) || {};
  const { availableCoupons = [], bestDeal = null } = couponState;
  const [busyCode, setBusyCode] = useState(null);
  const [bestBusy, setBestBusy] = useState(false);
  const [open, setOpen] = useState(false);
  // Guard against setState after unmount while /validate is in flight.
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Debounced fetch — only when the cart actually changes meaningfully.
  useEffect(() => {
    if (!subtotal && !itemCount) return;
    const t = setTimeout(() => {
      dispatch(getAvailableCoupons(subtotal, itemCount));
      dispatch(getBestDeal(subtotal, itemCount));
    }, 250);
    return () => clearTimeout(t);
  }, [subtotal, itemCount, dispatch]);

  const applyFromOffer = async (offer) => {
    setBusyCode(offer.code);
    try {
      // /validate is the source of truth for the cart-applied payload.
      // Send cart context so eligibility (minSubtotal, minItems, etc.)
      // is enforced server-side.
      const { default: axios } = await import("axios");
      const { data } = await axios.post("/api/v1/coupon/validate", {
        code: offer.code,
        itemSubtotal: subtotal,
        itemCount,
      });
      if (data.valid) {
        dispatch({ type: "ApplyCoupon", payload: data.coupon });
        toast.success(`Coupon ${data.coupon.code} applied`);
      } else {
        toast.error(data.message || "Coupon no longer applies");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not apply coupon");
    } finally {
      if (mountedRef.current) setBusyCode(null);
    }
  };

  const autoApplyBest = async () => {
    if (!bestDeal) return;
    setBestBusy(true);
    try {
      const { default: axios } = await import("axios");
      const { data } = await axios.post("/api/v1/coupon/validate", {
        code: bestDeal.code,
        itemSubtotal: subtotal,
        itemCount,
      });
      if (data.valid) {
        dispatch({ type: "ApplyCoupon", payload: data.coupon });
        toast.success(`Best deal: ${bestDeal.code} applied`);
      } else {
        toast.error(data.message || "Best deal no longer applies");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not apply best deal");
    } finally {
      if (mountedRef.current) setBestBusy(false);
    }
  };

  if (!availableCoupons.length && !bestDeal) {
    return null; // Nothing to suggest — keep the cart uncluttered.
  }

  return (
    <Box
      data-testid="coupon-offers-panel"
      sx={{
        border: "1px dashed var(--t-accent-sage-200, #C7D2BC)",
        borderRadius: "var(--t-border-radius-base)",
        padding: dense ? 1.5 : 2,
        marginBottom: dense ? 1.5 : 2,
        backgroundColor: "var(--t-neutral-50)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: open ? 1.5 : 0,
        }}
      >
        <Box>
          <Overline style={{ marginBottom: 2 }}>
            {availableCoupons.length} offer{availableCoupons.length === 1 ? "" : "s"} available
          </Overline>
          {bestDeal && (
            <BodyText small style={{ color: "var(--t-neutral-700)" }}>
              Best: <strong>{bestDeal.code}</strong> — save {fmt(bestDeal.estimatedDiscount || 0)}
            </BodyText>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {bestDeal && (
            <GhostBtn
              size="small"
              onClick={autoApplyBest}
              disabled={bestBusy}
              data-testid="auto-apply-best-deal"
            >
              {bestBusy ? "…" : "Auto-apply best"}
            </GhostBtn>
          )}
          <GhostBtn size="small" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide" : "See all"}
          </GhostBtn>
        </Box>
      </Box>

      {open && (
        <Box sx={{ display: "grid", gap: 1 }}>
          {availableCoupons.map((offer) => (
            <Box
              key={offer.code}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "var(--t-border-radius-sm)",
                backgroundColor: "#fff",
                border: "1px solid var(--t-neutral-200)",
              }}
            >
              <Box>
                <Box sx={{ fontWeight: 600, fontSize: 14 }}>{offer.code}</Box>
                <BodyText small style={{ color: "var(--t-neutral-600)" }}>
                  {offer.name} · {describeOffer(offer)}
                  {offer.estimatedDiscount ? ` · save ${fmt(offer.estimatedDiscount)}` : ""}
                </BodyText>
              </Box>
              <GhostBtn
                size="small"
                onClick={() => applyFromOffer(offer)}
                disabled={busyCode === offer.code}
                data-testid={`apply-offer-${offer.code}`}
              >
                {busyCode === offer.code ? "…" : "Apply"}
              </GhostBtn>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
