import React from "react";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

/**
 * Breadcrumb — quiet, narrow, above section headings.
 * items: [{ label, to? }]. Last item rendered as plain text (current page).
 */
export const Breadcrumb = ({ items = [], sx }) => (
  <Box
    component="nav"
    aria-label="Breadcrumb"
    sx={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 0.5,
      fontSize: "var(--t-fontSize-sm)",
      color: "var(--t-neutral-500)",
      letterSpacing: "0.02em",
      mb: 2,
      ...sx,
    }}
  >
    {items.map((item, i) => {
      const last = i === items.length - 1;
      return (
        <React.Fragment key={`${item.label}-${i}`}>
          {item.to && !last ? (
            <Box
              component={Link}
              to={item.to}
              sx={{
                color: "var(--t-neutral-500)",
                textDecoration: "none",
                transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                "&:hover": { color: "var(--t-primary-600)" },
              }}
            >
              {item.label}
            </Box>
          ) : (
            <Box
              component="span"
              sx={{
                color: last ? "var(--t-neutral-900)" : "var(--t-neutral-500)",
                fontWeight: last ? 500 : 400,
              }}
              aria-current={last ? "page" : undefined}
            >
              {item.label}
            </Box>
          )}
          {!last && (
            <NavigateNextIcon sx={{ fontSize: 16, color: "var(--t-neutral-300)" }} aria-hidden />
          )}
        </React.Fragment>
      );
    })}
  </Box>
);

export default Breadcrumb;
