import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import { Box, Stack } from "@mui/material";

const ITEMS = [
  { icon: LockOutlinedIcon, label: "SSL · Secure checkout" },
  { icon: CreditCardOutlinedIcon, label: "Powered by Stripe" },
  { icon: AssignmentReturnOutlinedIcon, label: "Free returns within 30 days" },
];

export default function TrustStrip() {
  return (
    <Box aria-label="Trust and security">
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", rowGap: 1 }}>
        {ITEMS.map(({ icon: Icon, label }) => (
          <Box
            key={label}
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.625,
              borderRadius: "var(--t-border-radius-pill)",
              backgroundColor: "var(--t-accent-sage-50)",
              color: "var(--t-accent-sage-600)",
              border: "1px solid var(--t-accent-sage-100)",
              fontSize: "var(--t-fontSize-xs)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              transition: "transform var(--t-motion-duration-fast) var(--t-motion-easing-out)",
            }}
          >
            <Icon sx={{ fontSize: 14 }} />
            <span>{label}</span>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
