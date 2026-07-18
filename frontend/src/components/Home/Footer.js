import React from "react";
import { Link } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { useSelector } from "react-redux";
import { Divider } from "../../design/primitives";

const STATIC_CARE = [
  { label: "Our keeper's covenant", href: "/aboutus" },
  { label: "Lifetime mending", href: "/aboutus" },
  { label: "Care guide", href: "/aboutus" },
  { label: "Shipping & returns", href: "/aboutus" },
  { label: "Contact", href: "/aboutus" },
];

const STATIC_ACCOUNT = [
  { label: "Sign in", href: "/signin" },
  { label: "Create an account", href: "/signup" },
  { label: "Your kept pieces", href: "/myorders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Update details", href: "/account" },
];

function FooterLink({ to, children }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        color: "var(--t-neutral-400)",
        textDecoration: "none",
        fontSize: "var(--t-fontSize-sm)",
        letterSpacing: "0.04em",
        transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
        "&:hover": { color: "var(--t-neutral-50)" },
      }}
    >
      {children}
    </Box>
  );
}

export default function Footer() {
  const categories = useSelector((s) => s.categories?.categories || []);

  // Build Shop column: top-level + dynamic categories (capitalized) pulled from store
  const shopLinks = [
    { label: "The collection", href: "/products" },
    ...categories.slice(0, 4).map((c) => ({
      label: c.charAt(0).toUpperCase() + c.slice(1),
      href: `/products?category=${encodeURIComponent(c)}`,
    })),
  ];
  const columns = [
    { heading: "Shop", links: shopLinks },
    { heading: "Care", links: STATIC_CARE },
    { heading: "Account", links: STATIC_ACCOUNT },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "var(--t-neutral-900)",
        color: "var(--t-neutral-400)",
        pt: { xs: 6, md: 10 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Container>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "1.4fr repeat(3, 1fr)" },
            gap: { xs: 4, md: 6 },
            mb: { xs: 5, md: 8 },
          }}
        >
          <Box>
            <Box
              component={Link}
              to="/"
              sx={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "1.75rem",
                fontWeight: 500,
                color: "var(--t-neutral-50)",
                textDecoration: "none",
                fontStyle: "italic",
                display: "inline-block",
                mb: 2,
              }}
            >
              Hverdag
            </Box>
            <Box
              sx={{
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                color: "var(--t-neutral-300)",
                fontSize: "1.0625rem",
                lineHeight: 1.55,
                maxWidth: "32ch",
              }}
            >
              Made to last. Looked after, not thrown away. Every piece is a quieter kind of promise
              — between the maker, the keeper, and the years it will live through.
            </Box>
            <Box
              sx={{
                mt: 3,
                fontSize: "var(--t-fontSize-sm)",
                color: "var(--t-neutral-500)",
              }}
            >
              Stockholm · Copenhagen · Edinburgh
            </Box>
          </Box>

          {columns.map((col) => (
            <Box key={col.heading}>
              <Box
                sx={{
                  fontSize: "var(--t-fontSize-xs)",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--t-neutral-100)",
                  mb: 2,
                }}
              >
                {col.heading}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {col.links.map((l) => (
                  <FooterLink key={l.label} to={l.href}>
                    {l.label}
                  </FooterLink>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ background: "var(--t-neutral-700)", mb: 3 }} />

        {/* Bottom row — copyright + payment badges + legal */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2.5,
              flexWrap: "wrap",
              fontSize: "var(--t-fontSize-sm)",
              color: "var(--t-neutral-500)",
            }}
          >
            <FooterLink to="/aboutus">Privacy</FooterLink>
            <FooterLink to="/aboutus">Terms</FooterLink>
            <FooterLink to="/aboutus">Cookies</FooterLink>
            <FooterLink to="/aboutus">Accessibility</FooterLink>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              fontSize: "var(--t-fontSize-xs)",
              color: "var(--t-neutral-500)",
              letterSpacing: "0.08em",
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: "1px solid var(--t-neutral-700)",
                borderRadius: "var(--t-border-radius-sm)",
                color: "var(--t-neutral-300)",
                fontWeight: 600,
              }}
            >
              VISA
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: "1px solid var(--t-neutral-700)",
                borderRadius: "var(--t-border-radius-sm)",
                color: "var(--t-neutral-300)",
                fontWeight: 600,
              }}
            >
              MC
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: "1px solid var(--t-neutral-700)",
                borderRadius: "var(--t-border-radius-sm)",
                color: "var(--t-neutral-300)",
                fontWeight: 600,
              }}
            >
              AMEX
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: "1px solid var(--t-neutral-700)",
                borderRadius: "var(--t-border-radius-sm)",
                color: "var(--t-neutral-300)",
                fontWeight: 600,
              }}
            >
              PayPal
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: "1px solid var(--t-neutral-700)",
                borderRadius: "var(--t-border-radius-sm)",
                color: "var(--t-neutral-300)",
                fontWeight: 600,
              }}
            >
              Stripe
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
