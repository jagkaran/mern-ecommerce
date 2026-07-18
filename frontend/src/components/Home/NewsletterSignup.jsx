import React, { useState } from "react";
import { Box, Container } from "@mui/material";
import { PrimaryBtn, Reveal } from "../../design/primitives";

/**
 * NewsletterSignup — covenant email capture.
 * Phrased gently: "When we have something worth saying, we'll write."
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubmitted(true);
    }
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "var(--t-neutral-900)",
        color: "var(--t-neutral-100)",
      }}
    >
      <Container>
        <Box
          sx={{
            maxWidth: "var(--t-measure-base)",
            mx: "auto",
            textAlign: "center",
          }}
        >
          <Reveal>
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
              The covenant
            </Box>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                fontWeight: 500,
                color: "var(--t-neutral-50)",
                lineHeight: 1.2,
                letterSpacing: "var(--t-letterSpacing-tight)",
                marginBottom: "1rem",
              }}
            >
              Join the quiet list.
            </h2>
            <p
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                color: "var(--t-neutral-400)",
                fontSize: "1.125rem",
                lineHeight: 1.6,
                marginBottom: "2.5rem",
              }}
            >
              When we have something worth saying, we'll write. When something arrives back from the
              workshop, you'll be the first to know.
            </p>
            {submitted ? (
              <Box
                sx={{
                  fontFamily: "var(--t-fontFamily-display)",
                  fontStyle: "italic",
                  color: "var(--t-accent-sage-300)",
                  fontSize: "1.25rem",
                  py: 2,
                }}
              >
                Welcome to the covenant. Look for our first letter soon.
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "stretch",
                  maxWidth: 520,
                  mx: "auto",
                }}
              >
                <Box
                  component="input"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    flex: 1,
                    px: 2.5,
                    py: 1.75,
                    backgroundColor: "transparent",
                    border: "1px solid var(--t-neutral-700)",
                    borderRadius: "var(--t-border-radius-base)",
                    color: "var(--t-neutral-50)",
                    fontFamily: "inherit",
                    fontSize: "var(--t-fontSize-base)",
                    transition:
                      "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                    "&::placeholder": { color: "var(--t-neutral-500)" },
                    "&:focus": {
                      outline: "none",
                      borderColor: "var(--t-primary-400)",
                    },
                  }}
                />
                <PrimaryBtn type="submit" sx={{ flexShrink: 0 }}>
                  Join
                </PrimaryBtn>
              </Box>
            )}
            <Box
              sx={{
                mt: 2,
                fontSize: "var(--t-fontSize-sm)",
                color: "var(--t-neutral-500)",
              }}
            >
              A letter or two a season. Unsubscribe whenever you like.
            </Box>
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
