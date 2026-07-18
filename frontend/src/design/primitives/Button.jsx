import React from "react";
import { Button as MuiButton } from "@mui/material";

export const PrimaryBtn = ({ children, ...props }) => (
  <MuiButton
    variant="contained"
    sx={{
      bgcolor: "var(--t-primary-600)",
      color: "#fff",
      fontWeight: 500,
      letterSpacing: "0.04em",
      px: 3.5,
      py: 1.5,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      boxShadow: "var(--t-shadow-sm)",
      transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": {
        bgcolor: "var(--t-primary-700)",
        boxShadow: "var(--t-shadow-md)",
        transform: "translateY(-1px)",
      },
      "&:active": {
        bgcolor: "var(--t-primary-700)",
        transform: "translateY(0)",
      },
      "&:disabled": {
        bgcolor: "var(--t-neutral-300)",
        color: "var(--t-neutral-500)",
        transform: "none",
        boxShadow: "none",
      },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </MuiButton>
);

export const SecondaryBtn = ({ children, ...props }) => (
  <MuiButton
    variant="outlined"
    sx={{
      borderColor: "var(--t-neutral-300)",
      color: "var(--t-neutral-700)",
      fontWeight: 500,
      px: 3.5,
      py: 1.5,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      backgroundColor: "transparent",
      transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": {
        borderColor: "var(--t-neutral-500)",
        bgcolor: "var(--t-neutral-100)",
        transform: "translateY(-1px)",
      },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </MuiButton>
);

export const GhostBtn = ({ children, ...props }) => (
  <MuiButton
    variant="text"
    sx={{
      color: "var(--t-neutral-700)",
      fontWeight: 500,
      px: 2,
      py: 1,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": {
        color: "var(--t-primary-600)",
        bgcolor: "var(--t-neutral-100)",
      },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </MuiButton>
);
