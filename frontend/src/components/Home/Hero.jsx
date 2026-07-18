import React from "react";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";
import { PrimaryBtn, GhostBtn } from "../../design/primitives";

/**
 * Hero — calm welcome. Text-led, centered, no visual noise.
 */
export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "var(--t-neutral-50)",
        backgroundImage:
          "radial-gradient(at 18% 22%, rgba(146, 89, 63, 0.05) 0, transparent 55%), radial-gradient(at 82% 65%, rgba(138, 154, 123, 0.05) 0, transparent 55%)",
        px: "var(--t-grid-containerPad)",
        py: { xs: 8, md: 12 },
      }}
    >
      <Box
        sx={{
          maxWidth: "var(--t-measure-base)",
          mx: "auto",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            fontSize: "var(--t-fontSize-xs)",
            fontWeight: 500,
            letterSpacing: "var(--t-letterSpacing-widest)",
            textTransform: "uppercase",
            color: "var(--t-neutral-600)",
            mb: 2,
          }}
        >
          The everyday, kept well
        </Box>
        <h1
          style={{
            fontFamily: "var(--t-fontFamily-display)",
            fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "var(--t-letterSpacing-tight)",
            color: "var(--t-neutral-900)",
            marginBottom: "1.5rem",
          }}
        >
          Things that age with you,{" "}
          <span style={{ fontStyle: "italic", color: "var(--t-primary-600)" }}>gently.</span>
        </h1>
        <p
          style={{
            color: "var(--t-neutral-600)",
            marginBottom: "2.5rem",
            fontSize: "1.125rem",
            lineHeight: 1.65,
          }}
        >
          Objects that wear in, not out. Sourced with care, mended when worn, and made to be passed
          on rather than replaced.
        </p>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
          <PrimaryBtn component={Link} to="/products">
            Browse the collection
          </PrimaryBtn>
          <GhostBtn component={Link} to="/aboutus">
            Our keeper&apos;s covenant
          </GhostBtn>
        </Box>
        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            pt: { xs: 4, md: 5 },
            borderTop: "1px solid var(--t-neutral-200)",
            display: "flex",
            gap: { xs: 4, md: 6 },
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Stat value="500+" label="pieces in the collection" />
          <Stat value="14" label="makers we know by name" />
          <Stat value="Forever" label="free mending, included" />
        </Box>
      </Box>
    </Box>
  );
}

const Stat = ({ value, label }) => (
  <Box>
    <Box
      sx={{
        fontFamily: "var(--t-fontFamily-display)",
        fontSize: "1.75rem",
        fontWeight: 500,
        color: "var(--t-neutral-900)",
        lineHeight: 1,
        letterSpacing: "var(--t-letterSpacing-tight)",
      }}
    >
      {value}
    </Box>
    <Box
      sx={{
        fontSize: "var(--t-fontSize-sm)",
        color: "var(--t-neutral-500)",
        mt: 0.5,
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </Box>
  </Box>
);
