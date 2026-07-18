import React from "react";
import { Box, Container } from "@mui/material";
import { Link } from "react-router-dom";
import { Overline, PrimaryBtn, GhostBtn, Reveal, Breadcrumb } from "../design/primitives";
import Seo from "./Seo";
import EditorialSplit from "./Home/EditorialSplit";

const PILLARS = [
  {
    title: "Mended, not replaced",
    body: "Every piece we sell carries a lifetime care covenant. Wood is re-oiled. Ceramic is re-glazed. Linen is re-stitched. Knives are re-sharpened. Forever, at no charge.",
  },
  {
    title: "Traced to the maker",
    body: "We name every workshop we work with. A woodworker in Värmland. A ceramicist in Provence. A linen weaver in the Belgian Ardennes. We visit when we can, and we pay what the work is worth.",
  },
  {
    title: "Plastic-free, by default",
    body: "Every order leaves in recyclable packaging with a handwritten note. Returns come back the same way. We compost the cellophane from our samples.",
  },
  {
    title: "Quiet, on purpose",
    body: 'No countdown timers. No urgency nudges. No "you might also like" carousels. We make the site calm because we hope the objects will bring you some of the same.',
  },
];

const STACK = [
  {
    area: "Frontend",
    detail: "React 17, Redux Toolkit, Material UI v5, Framer-style organic motion",
  },
  { area: "Backend", detail: "Node.js 20, Express 4, Mongoose 8" },
  { area: "Database", detail: "MongoDB Atlas" },
  { area: "Auth", detail: "JWT in httpOnly cookie + double-submit CSRF token" },
  { area: "Payments", detail: "Stripe Elements + webhook HMAC verification" },
  { area: "Storage", detail: "Cloudinary" },
];

export default function AboutUs() {
  return (
    <>
      <Seo
        title="About | Hverdag"
        description="The keeper's covenant — who makes our pieces, how we mend them, and why we believe in fewer, better things."
        path="/aboutus"
      />

      {/* Hero — manifesto */}
      <Box
        component="section"
        sx={{
          backgroundColor: "var(--t-neutral-50)",
          backgroundImage:
            "radial-gradient(at 18% 22%, rgba(146, 89, 63, 0.06) 0, transparent 55%), radial-gradient(at 82% 70%, rgba(138, 154, 123, 0.06) 0, transparent 55%)",
          py: { xs: 8, md: 14 },
          px: "var(--t-grid-containerPad)",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Breadcrumb
            items={[{ label: "Home", to: "/" }, { label: "Our story" }]}
            sx={{ justifyContent: "center", mb: 3 }}
          />
          <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
            Our keeper's covenant
          </Overline>
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
            Made by hand.{" "}
            <span style={{ fontStyle: "italic", color: "var(--t-primary-600)" }}>
              Kept by hand.
            </span>
          </h1>
          <p
            style={{
              fontFamily: "var(--t-fontFamily-display)",
              fontStyle: "italic",
              fontSize: "1.25rem",
              lineHeight: 1.6,
              color: "var(--t-neutral-600)",
              maxWidth: "var(--t-measure-base)",
              margin: "0 auto 2.5rem",
            }}
          >
            Hverdag is a Nordic-rooted purveyor of thoughtfully sourced everyday essentials — for
            people who value calm over clutter. Every piece is a deliberate replacement for a
            throwaway habit.
          </p>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
            <PrimaryBtn component={Link} to="/products">
              Browse the collection
            </PrimaryBtn>
            <GhostBtn component={Link} to="/wishlist">
              See your kept pieces
            </GhostBtn>
          </Box>
        </Container>
      </Box>

      {/* Story */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "var(--t-grid-containerMax)",
          py: { xs: 6, md: 10 },
          px: "var(--t-grid-containerPad)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 4, md: 8 },
            alignItems: "start",
          }}
        >
          <Reveal>
            <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
              The story
            </Overline>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: "var(--t-letterSpacing-tight)",
                color: "var(--t-neutral-900)",
                marginBottom: "1.5rem",
              }}
            >
              Hverdag began in a kitchen, not a boardroom.
            </h2>
          </Reveal>
          <Box
            sx={{
              color: "var(--t-neutral-700)",
              fontSize: "var(--t-fontSize-base)",
              lineHeight: 1.75,
            }}
          >
            <p style={{ marginBottom: "1.25rem" }}>
              Hverdag grew out of a frustration with things that didn't last. A wooden spoon that
              cracked after two winters. A knife that dulled past sharpening. A favourite shirt
              whose first button fell off in the wash.
            </p>
            <p style={{ marginBottom: "1.25rem" }}>
              We started looking for the makers who still take the time to do it properly — and
              asking them quietly if they'd make us a few pieces. They did. People we know came by
              to see them, and ask if they could have one too. So we started a small shop.
            </p>
            <p style={{ marginBottom: 0 }}>
              That was the beginning of the keeper's covenant: when something wears, we mend it.
              When something breaks, we fix it. When something lasts past its usefulness, we help it
              find a new home.
            </p>
          </Box>
        </Box>
      </Container>

      {/* Pillars */}
      <Box
        component="section"
        sx={{ backgroundColor: "var(--t-neutral-100)", py: { xs: 6, md: 10 } }}
      >
        <Container
          maxWidth={false}
          sx={{ maxWidth: "var(--t-grid-containerMax)", px: "var(--t-grid-containerPad)" }}
        >
          <Box
            sx={{
              textAlign: "center",
              mb: { xs: 5, md: 7 },
              maxWidth: "var(--t-measure-base)",
              mx: "auto",
            }}
          >
            <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
              What we promise
            </Overline>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: "var(--t-letterSpacing-tight)",
                color: "var(--t-neutral-900)",
              }}
            >
              Four small promises.
            </h2>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: { xs: 3, md: 4 },
            }}
          >
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <Box
                  sx={{
                    backgroundColor: "#FFF",
                    borderRadius: "var(--t-border-radius-md)",
                    p: { xs: 3, md: 4 },
                    boxShadow: "var(--t-shadow-base)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--t-border-radius-pill)",
                      backgroundColor: "var(--t-primary-50)",
                      color: "var(--t-primary-600)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--t-fontFamily-display)",
                      fontWeight: 500,
                      fontSize: "1rem",
                    }}
                  >
                    {i + 1}
                  </Box>
                  <h3
                    style={{
                      fontFamily: "var(--t-fontFamily-display)",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      color: "var(--t-neutral-900)",
                      letterSpacing: "var(--t-letterSpacing-tight)",
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--t-neutral-600)",
                      fontSize: "var(--t-fontSize-base)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {p.body}
                  </p>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Maker story editorial */}
      <EditorialSplit
        overline="From the workshop"
        title="Made by hand, kept by hand."
        body="Each piece in our collection passes through the hands of an artisan we know by name. A woodworker in Värmland. A ceramicist in Provence. A linen weaver in the Belgian Ardennes. We pay them what the work is worth, visit when we can, and mend what they make — for as long as you keep it."
        ctaLabel="Meet Jagkaran"
        ctaHref="https://www.linkedin.com/in/jagkaran-singh/"
        ctaIcon="linkedin"
        imageSrc="/Pic-JK-min.jpg"
        imageAlt="Jagkaran Singh — maker of Hverdag"
        reverse={false}
      />

      {/* The covenant — mending explained */}
      <Box
        component="section"
        sx={{ backgroundColor: "var(--t-neutral-50)", py: { xs: 6, md: 10 } }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
              The covenant, in detail
            </Overline>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: "var(--t-letterSpacing-tight)",
                color: "var(--t-neutral-900)",
                marginBottom: "1.25rem",
              }}
            >
              How mending actually works.
            </h2>
            <p
              style={{
                color: "var(--t-neutral-600)",
                fontSize: "var(--t-fontSize-base)",
                lineHeight: 1.7,
                maxWidth: "var(--t-measure-base)",
                margin: "0 auto",
              }}
            >
              When a piece you bought from us shows wear, send us a photo. If the damage is in scope
              for mending (most things are), we'll send a prepaid return label. The work usually
              takes two to three weeks. We post it back to you, sharpened / re-oiled / re-glazed /
              re-stitched — whichever it needed. No charge, no fine print, no upsell.
            </p>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
              mt: 4,
            }}
          >
            {[
              { num: "~14 days", label: "Most mends back to you" },
              { num: "£0", label: "Postage, both ways" },
              { num: "∞", label: "For the life of the piece" },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{
                  textAlign: "center",
                  backgroundColor: "#FFF",
                  borderRadius: "var(--t-border-radius-md)",
                  p: 3,
                  boxShadow: "var(--t-shadow-base)",
                }}
              >
                <Box
                  sx={{
                    fontFamily: "var(--t-fontFamily-display)",
                    fontSize: "1.75rem",
                    fontWeight: 500,
                    color: "var(--t-primary-700)",
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {s.num}
                </Box>
                <Box sx={{ fontSize: "var(--t-fontSize-sm)", color: "var(--t-neutral-500)" }}>
                  {s.label}
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stack — short, honest */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "var(--t-grid-containerMax)",
          py: { xs: 6, md: 10 },
          px: "var(--t-grid-containerPad)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
            gap: { xs: 3, md: 6 },
          }}
        >
          <Box>
            <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 2 }}>
              Under the hood
            </Overline>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "1.75rem",
                fontWeight: 500,
                color: "var(--t-neutral-900)",
                letterSpacing: "var(--t-letterSpacing-tight)",
                margin: 0,
              }}
            >
              How this shop is built.
            </h2>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {STACK.map((row, i) => (
              <Box
                key={row.area}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" },
                  gap: 2,
                  alignItems: "baseline",
                  py: 1.5,
                  borderTop: i === 0 ? "none" : "1px solid var(--t-neutral-200)",
                  borderBottom: i === STACK.length - 1 ? "1px solid var(--t-neutral-200)" : "none",
                }}
              >
                <Box
                  sx={{
                    fontSize: "var(--t-fontSize-xs)",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--t-neutral-500)",
                  }}
                >
                  {row.area}
                </Box>
                <Box sx={{ fontSize: "var(--t-fontSize-base)", color: "var(--t-neutral-700)" }}>
                  {row.detail}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Closing CTA */}
      <Box
        component="section"
        sx={{
          backgroundColor: "var(--t-neutral-900)",
          color: "var(--t-neutral-100)",
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          textAlign: "center",
          px: "var(--t-grid-containerPad)",
        }}
      >
        <Container maxWidth="md">
          <h2
            style={{
              fontFamily: "var(--t-fontFamily-display)",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 500,
              color: "var(--t-neutral-50)",
              lineHeight: 1.2,
              letterSpacing: "var(--t-letterSpacing-tight)",
              marginBottom: "1rem",
            }}
          >
            Find something to keep.
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
            Or send us a question. We read every one.
          </p>
          <Box
            sx={{ display: "inline-flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}
          >
            <PrimaryBtn component={Link} to="/products">
              Browse the collection
            </PrimaryBtn>
            <GhostBtn component={Link} to="/signup">
              Join the covenant
            </GhostBtn>
          </Box>
        </Container>
      </Box>
    </>
  );
}
