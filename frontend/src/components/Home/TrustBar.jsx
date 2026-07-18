import React from "react";
import { Box, Container } from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

const ITEMS = [
  {
    icon: HandshakeOutlinedIcon,
    title: "Lifetime mending",
    body: "Free care, forever — wood, ceramic, linen, knives.",
  },
  {
    icon: LocalShippingOutlinedIcon,
    title: "Plastic-free delivery",
    body: "Recyclable packaging and a handwritten note.",
  },
  {
    icon: ParkOutlinedIcon,
    title: "Sourced with care",
    body: "Every maker named, every workshop traced.",
  },
  {
    icon: ReplayOutlinedIcon,
    title: "30 quiet-day returns",
    body: "No fuss. No fine print. Just a quiet exchange.",
  },
];

export default function TrustBar() {
  return (
    <Box
      component="section"
      aria-label="What we promise"
      sx={{
        backgroundColor: "var(--t-neutral-50)",
        borderBlock: "1px solid var(--t-neutral-200)",
      }}
    >
      <Container>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: { xs: 2, md: 4 },
            py: { xs: 4, md: 5 },
          }}
        >
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <Box
              key={title}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Icon
                sx={{
                  color: "var(--t-primary-600)",
                  fontSize: 28,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              />
              <Box>
                <Box
                  component="h3"
                  sx={{
                    fontFamily: "var(--t-fontFamily-sans)",
                    fontSize: "var(--t-fontSize-sm)",
                    fontWeight: 600,
                    color: "var(--t-neutral-900)",
                    letterSpacing: "0.01em",
                    m: 0,
                    mb: 0.5,
                  }}
                >
                  {title}
                </Box>
                <Box
                  sx={{
                    fontSize: "var(--t-fontSize-sm)",
                    color: "var(--t-neutral-500)",
                    lineHeight: 1.5,
                  }}
                >
                  {body}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
