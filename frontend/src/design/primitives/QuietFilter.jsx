import React, { useState } from "react";
import { Box, Typography, Chip, Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";

/**
 * QuietFilter — shelf-side filters. Sit quietly, not a control panel.
 * Renders inline on desktop; Drawer on mobile via toggle.
 */
export const QuietFilter = ({ title = "Filters", children, sx, mobileBreakpoint = 1024 }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 96,
          alignSelf: "flex-start",
          ...sx,
        }}
      >
        <FilterBody title={title}>{children}</FilterBody>
      </Box>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Chip
          icon={<TuneIcon sx={{ fontSize: 18 }} />}
          label="Filters"
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: "var(--t-neutral-100)",
            color: "var(--t-neutral-700)",
            borderRadius: "var(--t-border-radius-pill)",
            fontWeight: 500,
            px: 0.5,
            "&:hover": { backgroundColor: "var(--t-neutral-200)" },
          }}
        />
      </Box>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "85vw", sm: 360 },
            p: 3,
            backgroundColor: "var(--t-neutral-50)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5">{title}</Typography>
          <IconButton onClick={() => setOpen(false)} aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        </Box>
        <FilterBody>{children}</FilterBody>
      </Drawer>
    </>
  );
};

const FilterBody = ({ title, children }) => (
  <Box>
    <Typography variant="overline" sx={{ display: "block", mb: 2, color: "var(--t-neutral-500)" }}>
      {title}
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>{children}</Box>
  </Box>
);

/**
 * FilterGroup — labeled section inside QuietFilter.
 */
export const FilterGroup = ({ label, children, sx }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, ...sx }}>
    <Typography variant="overline" sx={{ color: "var(--t-neutral-600)", fontSize: "0.7rem" }}>
      {label}
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>{children}</Box>
  </Box>
);

/**
 * FilterOption — quiet row with terracotta dot when active.
 */
export const FilterOption = ({ active, label, count, onClick }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      py: 0.75,
      px: 0,
      color: active ? "var(--t-neutral-900)" : "var(--t-neutral-600)",
      fontFamily: "inherit",
      fontSize: "var(--t-fontSize-sm)",
      fontWeight: active ? 500 : 400,
      letterSpacing: "0.01em",
      textAlign: "left",
      transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": { color: "var(--t-primary-600)" },
      "&:focus-visible": {
        outline: "2px solid var(--t-primary-600)",
        outlineOffset: "2px",
        borderRadius: "var(--t-border-radius-sm)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: "var(--t-border-radius-pill)",
          backgroundColor: active ? "var(--t-primary-600)" : "var(--t-neutral-200)",
          transition: "background-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
        }}
      />
      <span>{label}</span>
    </Box>
    {count !== undefined && (
      <Box component="span" sx={{ color: "var(--t-neutral-400)", fontSize: "0.8rem" }}>
        {count}
      </Box>
    )}
  </Box>
);

export default QuietFilter;
