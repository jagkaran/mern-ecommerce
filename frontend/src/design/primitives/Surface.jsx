import React from "react";
import { Box } from "@mui/material";

/**
 * Surface — elevated panel (cart/account/summary cards).
 * Plain, calm, well-lit. Soft shadow base.
 */
export const Surface = ({ children, padded = true, sx, ...props }) => (
  <Box
    sx={{
      backgroundColor: "#FFF",
      borderRadius: "var(--t-border-radius-md)",
      boxShadow: "var(--t-shadow-base)",
      overflow: "hidden",
      p: padded ? { xs: 2.5, sm: 3 } : 0,
      transition: "box-shadow var(--t-motion-duration-base) var(--t-motion-easing-out)",
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

/**
 * SurfaceHeader — title bar within a Surface.
 */
export const SurfaceHeader = ({ title, subtitle, action, sx }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      mb: 2,
      gap: 2,
      ...sx,
    }}
  >
    <Box>
      {title && (
        <Box
          component="h3"
          sx={{
            fontFamily: "var(--t-fontFamily-display)",
            fontSize: "1.25rem",
            fontWeight: 500,
            color: "var(--t-neutral-900)",
            letterSpacing: "var(--t-letterSpacing-tight)",
            m: 0,
          }}
        >
          {title}
        </Box>
      )}
      {subtitle && (
        <Box sx={{ color: "var(--t-neutral-500)", fontSize: "var(--t-fontSize-sm)", mt: 0.5 }}>
          {subtitle}
        </Box>
      )}
    </Box>
    {action}
  </Box>
);

export default Surface;
