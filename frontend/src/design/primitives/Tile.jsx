import React from "react";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Tile — soft, evenly-spaced product/category tile.
 * Light-touch hover: -2px lift + soft shadow.
 */
export const Tile = ({ to, children, equalHeight = true, sx, ...props }) => {
  const inner = (
    <Box
      sx={{
        backgroundColor: "#FFF",
        borderRadius: "var(--t-border-radius-md)",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--t-shadow-sm)",
        transition: "all var(--t-motion-duration-base) var(--t-motion-easing-out)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "var(--t-shadow-md)",
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );

  if (to) {
    return (
      <Box
        component={Link}
        to={to}
        sx={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          height: equalHeight ? "100%" : "auto",
        }}
      >
        {inner}
      </Box>
    );
  }
  return inner;
};

/**
 * TileMedia — image area (16:9 by default).
 */
export const TileMedia = ({ children, ratio = "4/3", sx }) => (
  <Box
    sx={{
      position: "relative",
      width: "100%",
      paddingBottom: ratio === "4/3" ? "75%" : ratio === "1/1" ? "100%" : "56.25%",
      backgroundColor: "var(--t-neutral-100)",
      overflow: "hidden",
      ...sx,
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  </Box>
);

/**
 * TileBody — content area under media.
 */
export const TileBody = ({ children, sx }) => (
  <Box
    sx={{
      p: { xs: 2, sm: 2.5 },
      display: "flex",
      flexDirection: "column",
      gap: 1,
      flex: 1,
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default Tile;
