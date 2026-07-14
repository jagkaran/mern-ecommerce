import React from "react";
import { Button } from "@mui/material";

/**
 * StickyCta — mobile bottom-bar Place Order button.
 * On viewports >= 900px, becomes inline via media query.
 */
export default function StickyCta({ totalLabel, onClick, submitting }) {
  return (
    <div
      className="co-sticky-cta"
      data-mobile={typeof window !== "undefined" && window.innerWidth < 900}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#fff",
        borderTop: "1px solid var(--t-neutral-200, #e5e5e5)",
        padding: "12px 16px",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <style>{`
        @media (min-width: 900px) {
          .co-sticky-cta { position: static !important; box-shadow: none !important; border-top: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <Button
        type="button"
        variant="contained"
        fullWidth
        onClick={onClick}
        disabled={submitting}
        aria-busy={submitting}
        sx={{
          bgcolor: "var(--t-primary-600, #1a1a1a)",
          color: "#fff",
          fontWeight: 600,
          py: 1.5,
          borderRadius: "var(--t-border-radius-base, 6px)",
          textTransform: "none",
          fontSize: "var(--t-fontSize-base, 1rem)",
          "&:hover": { bgcolor: "var(--t-primary-700, #000)" },
          "&:disabled": { opacity: 0.6 },
        }}
      >
        {submitting ? "Placing order…" : `Place order · ${totalLabel}`}
      </Button>
    </div>
  );
}