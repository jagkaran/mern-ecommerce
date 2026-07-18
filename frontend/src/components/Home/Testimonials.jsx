import React from "react";
import { Box, Container } from "@mui/material";
import { Overline, Reveal } from "../../design/primitives";

const QUOTES = [
  {
    body: "My grandmother had one of these bowls. Hers cracked in 1987 and she kept it on the dresser anyway. This one — same glaze, same weight, same feel — came with a card from the maker. I cried.",
    author: "Mira K.",
    place: "Oslo",
  },
  {
    body: "I emailed in March asking if the jacket could be re-stitched. They sent a prepaid label, fixed it in two weeks, and mailed it back with a hand-drawn repair diagram. That's the whole point, isn't it?",
    author: "Anders L.",
    place: "Copenhagen",
  },
  {
    body: "The knife arrived dull from a year of use. I posted a photo, they sharpened it for free, sent it back sharper than the day I bought it. Twelve quid of postage. Worth every øre.",
    author: "Saoirse R.",
    place: "Edinburgh",
  },
];

export default function Testimonials() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: "var(--t-neutral-50)",
      }}
    >
      <Container>
        <Box
          sx={{
            maxWidth: "var(--t-measure-base)",
            mx: "auto",
            mb: { xs: 5, md: 7 },
            textAlign: "center",
          }}
        >
          <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
            From the keepers
          </Overline>
          <h2
            style={{
              fontFamily: "var(--t-fontFamily-display)",
              fontSize: "clamp(2rem, 3.5vw, 2.5rem)",
              fontWeight: 500,
              color: "var(--t-neutral-900)",
              lineHeight: 1.25,
              letterSpacing: "var(--t-letterSpacing-tight)",
            }}
          >
            Letters from people who keep our pieces.
          </h2>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 3, md: 4 },
          }}
        >
          {QUOTES.map((q, i) => (
            <Reveal key={q.author} delay={i * 80}>
              <Box
                sx={{
                  backgroundColor: "#FFF",
                  borderRadius: "var(--t-border-radius-md)",
                  p: { xs: 3, md: 4 },
                  boxShadow: "var(--t-shadow-base)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    fontFamily: "var(--t-fontFamily-display)",
                    fontSize: "2rem",
                    color: "var(--t-primary-600)",
                    lineHeight: 1,
                  }}
                >
                  &ldquo;
                </Box>
                <Box
                  sx={{
                    fontSize: "var(--t-fontSize-base)",
                    color: "var(--t-neutral-700)",
                    lineHeight: 1.7,
                    flex: 1,
                  }}
                >
                  {q.body}
                </Box>
                <Box>
                  <Box
                    sx={{
                      fontFamily: "var(--t-fontFamily-display)",
                      fontStyle: "italic",
                      color: "var(--t-neutral-900)",
                      fontSize: "var(--t-fontSize-base)",
                    }}
                  >
                    {q.author}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "var(--t-fontSize-sm)",
                      color: "var(--t-neutral-500)",
                      letterSpacing: "0.04em",
                      mt: 0.25,
                    }}
                  >
                    {q.place}
                  </Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
