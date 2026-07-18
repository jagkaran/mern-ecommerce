// components/Home/Header/MegaMenu.jsx
// Hover-triggered category submenu for the "Shop" nav link. Fetches
// /api/v1/products/categories on first hover, caches in component state.
// Falls back gracefully (no menu) when the API is unreachable.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";
import axios from "axios";

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open && categories.length === 0) {
      axios
        .get("/api/v1/products/categories")
        .then((r) => setCategories(r.data?.categories || []))
        .catch(() => setCategories([]));
    }
  }, [open, categories.length]);

  // Delay close so the user can move the cursor from trigger into the panel
  // without it instantly disappearing.
  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  if (!open || categories.length === 0) {
    return (
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <Link
          to="/products"
          style={{
            color: "var(--t-neutral-500)",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "6px 2px",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Shop
        </Link>
      </span>
    );
  }

  return (
    <span
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <Link
        to="/products"
        style={{
          color: "var(--t-neutral-900)",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "6px 2px",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Shop
      </Link>
      <Box
        sx={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          mt: 1,
          backgroundColor: "var(--t-neutral-50)",
          border: "1px solid var(--t-neutral-200)",
          borderRadius: "var(--t-border-radius-base)",
          boxShadow: "var(--t-shadow-md)",
          padding: "12px 16px",
          minWidth: 200,
          zIndex: 1101,
          display: "grid",
          gap: "6px",
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat}
            to={`/products?category=${encodeURIComponent(cat)}`}
            style={{
              color: "var(--t-neutral-700)",
              textDecoration: "none",
              fontSize: "var(--t-fontSize-sm)",
              padding: "6px 4px",
              borderRadius: "var(--t-border-radius-sm)",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-neutral-100)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {cat}
          </Link>
        ))}
      </Box>
    </span>
  );
}
