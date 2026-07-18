import React from "react";
import { Link } from "react-router-dom";
import { Box, Container } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PrimaryBtn, Reveal } from "../../design/primitives";

/**
 * EditorialSplit — image left, story right.
 * Reusable asymmetric editorial block.
 *
 * Props:
 *   imageSrc — optional image URL; falls back to alt-text placeholder
 *   ctaHref — internal path (uses react-router Link) or external http(s) URL (anchor)
 *   ctaIcon  — optional: "linkedin" | "external" | custom ReactNode; renders before label
 */
export default function EditorialSplit({
  overline = "From the workshop",
  title = "Made by hand, kept by hand.",
  body = "Each piece in our collection passes through the hands of an artisan we know by name. A woodworker in Värmland. A ceramicist in Provence. A linen weaver in the Belgian Ardennes. We pay them what the work is worth, visit when we can, and mend what they make — for as long as you keep it.",
  ctaLabel = "Meet the makers",
  ctaHref = "/aboutus",
  ctaIcon,
  imageSrc,
  imageAlt = "A maker at work",
  reverse = false,
}) {
  const isExternal = /^https?:\/\//i.test(ctaHref || "");
  const Icon =
    ctaIcon === "linkedin" ? LinkedInIcon : ctaIcon === "external" ? OpenInNewIcon : null;

  const ctaButton = isExternal ? (
    <PrimaryBtn
      component="a"
      href={ctaHref}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
    >
      {Icon && <Icon sx={{ fontSize: 18 }} />}
      {ctaLabel}
    </PrimaryBtn>
  ) : (
    <PrimaryBtn
      component={Link}
      to={ctaHref}
      sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
    >
      {Icon && <Icon sx={{ fontSize: 18 }} />}
      {ctaLabel}
    </PrimaryBtn>
  );

  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "var(--t-neutral-100)",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: reverse ? "1fr 1fr" : "1fr 1fr" },
            gap: { xs: 4, md: 8 },
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              aspectRatio: { xs: "4/3", md: "5/4" },
              borderRadius: "var(--t-border-radius-lg)",
              overflow: "hidden",
              backgroundColor: "var(--t-neutral-200)",
              boxShadow: "var(--t-shadow-md)",
              order: { xs: 0, md: reverse ? 2 : 1 },
            }}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--t-primary-600)",
                  fontFamily: "var(--t-fontFamily-display)",
                  fontStyle: "italic",
                  fontSize: "1.5rem",
                  opacity: 0.4,
                }}
              >
                {imageAlt}
              </Box>
            )}
          </Box>
          <Reveal sx={{ order: { xs: 1, md: reverse ? 1 : 2 } }}>
            <Box
              sx={{
                fontSize: "var(--t-fontSize-xs)",
                fontWeight: 500,
                letterSpacing: "var(--t-letterSpacing-widest)",
                textTransform: "uppercase",
                color: "var(--t-neutral-500)",
                mb: 2,
              }}
            >
              {overline}
            </Box>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                color: "var(--t-neutral-900)",
                lineHeight: 1.25,
                letterSpacing: "var(--t-letterSpacing-tight)",
                marginBottom: "1.25rem",
                maxWidth: "20ch",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                color: "var(--t-neutral-700)",
                fontSize: "var(--t-fontSize-base)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
                maxWidth: "var(--t-measure-base)",
              }}
            >
              {body}
            </p>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>{ctaButton}</Box>
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
