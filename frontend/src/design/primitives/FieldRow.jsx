import React from "react";
import { Box } from "@mui/material";

/**
 * FieldRow — generous spacing wrapper for field groupings (checkout form rows).
 * 1.5rem row spacing on desktop, 1rem on mobile.
 */
export const FieldRow = ({ children, columns = 2, sx, ...props }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: { xs: 2, sm: 3 },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

export default FieldRow;
