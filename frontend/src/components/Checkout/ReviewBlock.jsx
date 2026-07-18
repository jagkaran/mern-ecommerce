import React from "react";
import { Box, Stack } from "@mui/material";
import { Surface, SurfaceHeader, Price, Divider } from "../../design/primitives";
import { fmtInCurrency } from "../../utils/fmtInCurrency";

export default function ReviewBlock({
  subtotal = 0,
  shipping = 0,
  originalShipping = null,
  tax = 0,
  discount = 0,
  freeShipping = false,
  coupon = null,
  total: totalProp,
  currency = "USD",
  rate = 1,
}) {
  // Currency-aware formatting — uses Intl.NumberFormat for non-USD so € / £
  // / etc. show the right symbol + thousands separator. USD is the storage
  // currency; the rate converts for display only.
  const fmt = (n) => fmtInCurrency(n, currency, rate);
  // When `total` is supplied, trust it as the source of truth (the parent
  // already computed and rounded the value). Otherwise fall back to the
  // local sum — same logic we had before the C4 wiring.
  const total =
    totalProp != null ? Number(totalProp) : Number(subtotal) + Number(shipping) + Number(tax);
  return (
    <Surface aria-label="Order summary" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <SurfaceHeader
        title="Order summary"
        subtitle="Quietly reviewed before you place your order."
      />

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        <SummaryRow label="Subtotal" value={fmt(subtotal)} />
        {discount > 0 && (
          <SummaryRow
            label={`Discount${coupon?.code ? ` (${coupon.code})` : ""}`}
            value={`-${fmt(discount)}`}
            tone="positive"
          />
        )}
        {freeShipping ? (
          <SummaryRow
            label="Shipping (free)"
            value={
              <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
                <Box
                  component="span"
                  sx={{
                    textDecoration: "line-through",
                    color: "var(--t-neutral-400)",
                    fontWeight: 400,
                  }}
                >
                  {fmt(originalShipping || shipping)}
                </Box>
                <Box
                  component="span"
                  sx={{ color: "var(--t-accent-sage-600, #5a7350)", fontWeight: 600 }}
                >
                  Free
                </Box>
              </Box>
            }
            tone="positive"
          />
        ) : (
          <SummaryRow label="Shipping" value={fmt(shipping)} />
        )}
        <SummaryRow label="Tax" value={fmt(tax)} />
      </Stack>

      <Divider sx={{ my: 2, backgroundColor: "var(--t-neutral-200)" }} />

      <Box
        data-testid="total"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: "var(--t-fontFamily-display)",
            fontSize: "var(--t-fontSize-lg)",
            fontWeight: 500,
            color: "var(--t-neutral-900)",
            letterSpacing: "var(--t-letterSpacing-tight)",
          }}
        >
          Total
        </Box>
        <Price large>{fmt(total)}</Price>
      </Box>
    </Surface>
  );
}

function SummaryRow({ label, value, tone }) {
  const color = tone === "positive" ? "var(--t-accent-sage-600, #5a7350)" : "var(--t-neutral-900)";
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Box
        component="dt"
        sx={{
          fontSize: "var(--t-fontSize-sm)",
          color: "var(--t-neutral-600)",
          letterSpacing: "0.01em",
          m: 0,
        }}
      >
        {label}
      </Box>
      <Box
        component="dd"
        sx={{
          fontSize: "var(--t-fontSize-sm)",
          color,
          fontVariantNumeric: "tabular-nums",
          fontWeight: tone === "positive" ? 600 : 400,
          m: 0,
        }}
      >
        {value}
      </Box>
    </Box>
  );
}
