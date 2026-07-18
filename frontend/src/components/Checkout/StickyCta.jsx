import React from "react";
import { Box } from "@mui/material";
import { PrimaryBtn } from "../../design/primitives";

/**
 * StickyCta — Place Order button.
 * Mobile (<900px): fixed bottom bar with shadow + border.
 * Desktop (>=900px): inline when `inline` prop is set, otherwise fixed.
 */
export default function StickyCta({ totalLabel, onClick, submitting, inline = false }) {
  const btn = (
    <PrimaryBtn
      type="button"
      onClick={onClick}
      disabled={submitting}
      aria-busy={submitting}
      fullWidth
      sx={{
        py: 1.75,
        fontSize: "var(--t-fontSize-base)",
        minHeight: 48,
      }}
    >
      {submitting ? "Placing order…" : `Place order · ${totalLabel}`}
    </PrimaryBtn>
  );

  if (inline) {
    return <Box sx={{ width: "100%" }}>{btn}</Box>;
  }

  return (
    <Box
      className="co-sticky-cta"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "rgba(250, 250, 249, 0.96)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid var(--t-neutral-200)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 16px rgba(28, 25, 23, 0.06)",
        // ponytail: keep `inline` callers out of the fixed flow on >=900px
        "@media (min-width: 900px)": {
          display: "none",
        },
      }}
    >
      <Box sx={{ maxWidth: "var(--t-grid-containerMax)", marginInline: "auto" }}>{btn}</Box>
    </Box>
  );
}
