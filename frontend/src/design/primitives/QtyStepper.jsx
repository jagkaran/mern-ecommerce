import React from "react";
import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

/**
 * QtyStepper — tactile ± quantity control. 44px hit targets.
 * Forgiving: no hold-to-repeat. Click only.
 */
export const QtyStepper = ({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  ariaLabel = "Quantity",
  sx,
}) => {
  const dec = () => {
    if (disabled) return;
    const next = Math.max(min, (value || min) - 1);
    if (next !== value) onChange(next);
  };
  const inc = () => {
    if (disabled) return;
    const next = Math.min(max, (value || min) + 1);
    if (next !== value) onChange(next);
  };

  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid var(--t-neutral-200)",
        borderRadius: "var(--t-border-radius-base)",
        backgroundColor: "#FFF",
        transition: "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
        "&:hover": { borderColor: "var(--t-neutral-300)" },
        "&:focus-within": { borderColor: "var(--t-primary-600)" },
        opacity: disabled ? 0.5 : 1,
        ...sx,
      }}
    >
      <StepBtn onClick={dec} disabled={disabled || value <= min} ariaLabel="Decrease quantity">
        <RemoveIcon sx={{ fontSize: 18 }} />
      </StepBtn>
      <Box
        component="span"
        aria-live="polite"
        sx={{
          minWidth: 44,
          textAlign: "center",
          fontSize: "var(--t-fontSize-base)",
          fontWeight: 500,
          color: "var(--t-neutral-900)",
          transition: "opacity var(--t-motion-duration-fast) var(--t-motion-easing-out)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Box>
      <StepBtn onClick={inc} disabled={disabled || value >= max} ariaLabel="Increase quantity">
        <AddIcon sx={{ fontSize: 18 }} />
      </StepBtn>
    </Box>
  );
};

const StepBtn = ({ children, onClick, disabled, ariaLabel }) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    sx={{
      width: 44,
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      border: "none",
      color: disabled ? "var(--t-neutral-300)" : "var(--t-neutral-700)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover:not(:disabled)": {
        color: "var(--t-primary-600)",
        backgroundColor: "var(--t-neutral-100)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--t-primary-600)",
        outlineOffset: "-2px",
        borderRadius: "var(--t-border-radius-sm)",
      },
    }}
  >
    {children}
  </Box>
);

export default QtyStepper;
