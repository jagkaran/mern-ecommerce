import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

/**
 * ThanksBlock — calm confirmation close + illustrative touch.
 * Slowest motion in the journey (settle 500ms).
 */
export const ThanksBlock = ({
  title = "Thank you — we've got this",
  subtitle,
  orderRef,
  illustration,
  children,
  sx,
}) => {
  const ref = useRef(null);
  const [drawn, setDrawn] = React.useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !illustration) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setDrawn(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [illustration]);

  return (
    <Box
      sx={{
        textAlign: "center",
        maxWidth: 560,
        mx: "auto",
        py: { xs: 6, sm: 8 },
        px: 2,
        animation: "hverdagSettle 500ms var(--t-motion-easing-unfurl)",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          opacity: 1,
        },
        ...sx,
      }}
    >
      {illustration && (
        <Box
          ref={ref}
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "center",
            color: "var(--t-primary-600)",
            opacity: drawn ? 1 : 0,
            transition: "opacity 800ms var(--t-motion-easing-unfurl)",
          }}
        >
          {illustration}
        </Box>
      )}
      <Typography
        variant="h2"
        sx={{
          fontFamily: "var(--t-fontFamily-display)",
          fontWeight: 500,
          color: "var(--t-neutral-900)",
          mb: 2,
          fontSize: { xs: "2rem", sm: "2.5rem" },
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            color: "var(--t-neutral-600)",
            fontSize: "var(--t-fontSize-base)",
            lineHeight: 1.6,
            mb: orderRef ? 2 : 0,
          }}
        >
          {subtitle}
        </Typography>
      )}
      {orderRef && (
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "var(--t-neutral-500)",
            mb: 4,
          }}
        >
          Order #{orderRef}
        </Typography>
      )}
      {children}
    </Box>
  );
};

/**
 * SpoonIllustration — soft line drawing that draws on when scrolled into view,
 * with a quiet sage halo that settles in behind it. Wooden-spoon motif.
 */
export const SpoonIllustration = ({ size = 120 }) => {
  const ref = React.useRef(null);
  const [drawn, setDrawn] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setDrawn(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="var(--t-accent-sage-200)"
        style={{
          opacity: drawn ? 0.45 : 0,
          transformOrigin: "60px 60px",
          transform: drawn ? "scale(1)" : "scale(0.7)",
          transition:
            "opacity 700ms var(--t-motion-easing-unfurl), transform 800ms var(--t-motion-easing-unfurl)",
        }}
      />
      <path
        d="M60 25 Q 60 15, 65 15 Q 70 15, 70 22 L 70 50 Q 70 60, 75 65 Q 95 75, 95 90 Q 95 100, 80 100 Q 60 100, 50 90 Q 30 75, 35 60 Q 40 50, 50 50 L 50 22 Q 50 15, 55 15 Q 60 15, 60 25 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 400,
          strokeDashoffset: drawn ? 0 : 400,
          transition: "stroke-dashoffset 900ms var(--t-motion-easing-unfurl)",
        }}
      />
    </svg>
  );
};

export default ThanksBlock;
