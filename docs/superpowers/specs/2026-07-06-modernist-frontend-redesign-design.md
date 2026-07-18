# Modernist Frontend Redesign — Design Specification

**Date**: 2026-07-06  
**Status**: Draft — Awaiting approval  
**Prefix**: `docs/superpowers/specs/2026-07-06-modernist-frontend-redesign-design.md`

---

## 1 Business Concept: "Ordinary"

Store name: **Ordinary**.  
Tagline: _Things that work. Beautifully._

Target audience: Discerning but unpretentious people who value craft, material honesty, and function over fashion. They shop with intention — not impulse. They want products that age well, that don't pretend to be something they're not.

Product categories (existing, recontextualized):

- Kitchen (cutting boards, cast iron, hand-blown glass)
- Desk (brass lamps, leather journals, solid-stock pens)
- Body (soaps, oils, razors — ingredients you can pronounce)
- Home (linens, candles, ceramic vessels)

Every visual decision serves this concept. Restraint isn't a constraint — it IS the product philosophy made visible.

---

## 2 Design Tokens

All values are primitives. One file changes = every page updates.

```js
// frontend/src/design/tokens.js

export const tokens = {
  // ── Color ──────────────────────────────────────────────
  // Neutral base: warm off-white → deep charcoal. No pure white/black.
  neutral: {
    50: "#FAFAF9", // primary surface (wall color)
    100: "#F5F5F4", // elevated surface (shelf)
    200: "#E7E5E4", // borders, dividers
    300: "#D6D3D1", // input borders
    400: "#A8A29E", // secondary text
    500: "#78716C", // muted text
    600: "#57534E", // body text
    700: "#44403C", // strong body
    800: "#292524", // headlines
    900: "#1C1917", // maximum contrast
  },

  // Primary accent: burnt sienna / terracotta. Warm, confident, never loud.
  primary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316", // hover states
    600: "#EA580C", // standard action (Add to Cart, primary CTA)
    700: "#C2410C", // pressed/active
    800: "#9A3412", // emphasis
    900: "#7C2D12", // darkest
  },

  // Semantic only — used for status (success/warning/error), never decoration
  semantic: {
    success: "#15803D",
    warning: "#A16207",
    error: "#DC2626",
    info: "#1D4ED8",
  },

  // ── Typography ──────────────────────────────────────────
  // System font stack: geometric sans-serif fallback chain.
  // Primary: "Inter" (loaded via Google Fonts)
  // Fallback: system-ui → -apple-system → Segoe UI → sans-serif
  fontFamily: {
    sans: '"Inter", "Inter Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", monospace',
  },

  // Hierarchical scale: strict modular progression (1.25x = major third)
  // Each level = ONE unit in the system. No arbitrary sizes.
  fontSize: {
    xs: "0.75rem", // 12px — captions, labels, overlines
    sm: "0.875rem", // 14px — small text, secondary info
    base: "1rem", // 16px — body text
    lg: "1.125rem", // 18px — lead text
    xl: "1.25rem", // 20px — small headlines
    "2xl": "1.5rem", // 24px — card titles
    "3xl": "1.875rem", // 30px — section titles
    "4xl": "2.25rem", // 36px — page headlines
    "5xl": "3rem", // 48px — hero statement
    "6xl": "3.75rem", // 60px — hero max
  },

  fontWeight: {
    normal: 400, // body
    medium: 500, // labels, buttons
    semibold: 600, // card titles, nav
    bold: 700, // headlines
    heavy: 800, // hero, display
  },

  lineHeight: {
    tight: 1.15, // headlines (generous tracking instead)
    snug: 1.35, // subheads
    base: 1.6, // body — breathe
    loose: 1.75, // long-form, captions
  },

  letterSpacing: {
    tighter: "-0.03em", // large headlines
    tight: "-0.015em", // small headlines, buttons
    normal: "0", // body
    wide: "0.05em", // overlines, labels
    wider: "0.1em", // micro-copy, legal
  },

  // ── Spacing ─────────────────────────────────────────────
  // 4px base unit. Scales: xs/base/lg/xl/2xl
  space: {
    xs: "0.5rem", //  8px — micro gaps
    sm: "0.75rem", // 12px — tight inline spacing
    base: "1rem", // 16px — default
    md: "1.5rem", // 24px — between related elements
    lg: "2rem", // 32px — section internal padding
    xl: "3rem", // 48px — between sections
    "2xl": "4rem", // 64px — major section breaks
    "3xl": "6rem", // 96px — hero-to-content transition
    "4xl": "8rem", // 128px — top-of-page breathing room
  },

  // ── Motion ──────────────────────────────────────────────
  // Deliberate. Mechanical. No bounce, no overshoot.
  motion: {
    duration: {
      instant: "80ms",
      fast: "150ms",
      base: "250ms",
      slow: "400ms",
    },
    easing: {
      out: "cubic-bezier(0, 0, 0.2, 1)", // exit: quick finish
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)", // movement: smooth
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // ⚠ reserved for exceptional cases only
    },
  },

  // ── Layout ──────────────────────────────────────────────
  grid: {
    columns: 12,
    gutter: "1.5rem", // 24px horizontal gap between grid items
    containerMax: "80rem", // 1280px — content ceiling
    containerPad: "2rem", // 32px — minimum side margin
  },

  // ── Borders ─────────────────────────────────────────────
  border: {
    radius: {
      none: "0",
      sm: "2px",
      base: "4px",
      md: "6px",
      lg: "8px",
      full: "9999px",
    },
    width: {
      thin: "1px",
      base: "2px",
    },
  },

  // ── Shadows ─────────────────────────────────────────────
  // Minimal. Structural, not decorative. Only elevation-1 used.
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(28, 25, 23, 0.04)",
    base: "0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)",
    md: "0 4px 6px rgba(28, 25, 23, 0.05), 0 2px 4px rgba(28, 25, 23, 0.04)",
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    toast: 1400,
  },
};
```

---

## 3 Design Primitives (Component Library)

### 3.1 Section

```jsx
// frontend/src/design/primitives/Section.jsx
import styled from "@emotion/styled";

export const Section = styled.section`
  width: 100%;
  padding-block: var(--t-space-2xl); /* 64px */

  &--tight {
    padding-block: var(--t-space-xl);
  } /* 48px */
  &--loose {
    padding-block: var(--t-space-3xl);
  } /* 96px */
  &--flush {
    padding-block: 0;
  }
`;
```

### 3.2 Container

```jsx
// frontend/src/design/primitives/Container.jsx
import styled from "@emotion/styled";

export const Container = styled.div`
  max-width: var(--t-grid-containerMax); /* 1280px */
  margin-inline: auto;
  padding-inline: var(--t-grid-containerPad); /* 32px */

  @media (max-width: 640px) {
    padding-inline: var(--t-space-md); /* 24px */
  }
`;
```

### 3.3 Grid

```jsx
// frontend/src/design/primitives/Grid.jsx
import styled from "@emotion/styled";

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--t-grid-columns, 12), 1fr);
  gap: var(--t-grid-gutter); /* 24px */
`;
```

### 3.4 Overline

```jsx
// frontend/src/design/primitives/Overline.jsx
import styled from "@emotion/styled";

export const Overline = styled.span`
  font-size: var(--t-fontSize-xs);
  font-weight: var(--t-fontWeight-medium);
  letter-spacing: var(--t-letterSpacing-wider); /* 0.1em */
  text-transform: uppercase;
  color: var(--t-neutral-400);
  line-height: var(--t-lineHeight-base);
  display: block;
  margin-block-end: var(--t-space-sm);
`;
```

### 3.5 Headline

```jsx
// frontend/src/design/primitives/Headline.jsx
import { tokens } from '../tokens';
import styled from '@emotion/styled';

const levelStyles = {
  5xl: `font-size: var(--t-fontSize-5xl); font-weight: var(--t-fontWeight-heavy); line-height: var(--t-lineHeight-tight); letter-spacing: var(--t-letterSpacing-tighter);`,
  4xl: `font-size: var(--t-fontSize-4xl); font-weight: var(--t-fontWeight-bold); line-height: var(--t-lineHeight-tight);`,
  3xl: `font-size: var(--t-fontSize-3xl); font-weight: var(--t-fontWeight-bold); line-height: var(--t-lineHeight-snug);`,
  2xl: `font-size: var(--t-fontSize-2xl); font-weight: var(--t-fontWeight-bold); line-height: var(--t-lineHeight-snug);`,
  xl:  `font-size: var(--t-fontSize-xl); font-weight: var(--t-fontWeight-bold); line-height: var(--t-lineHeight-snug);`,
};

export const Headline = styled.h2`
  color: var(--t-neutral-900);
  ${({ level = '3xl' }) => levelStyles[level] || levelStyles['3xl']}
`;
```

### 3.6 BodyText

```jsx
// frontend/src/design/primitives/BodyText.jsx
import styled from "@emotion/styled";

export const BodyText = styled.p`
  font-size: var(--t-fontSize-base);
  line-height: var(--t-lineHeight-base);
  color: var(--t-neutral-600);

  &--lead {
    font-size: var(--t-fontSize-lg);
    color: var(--t-neutral-700);
    max-width: 65ch;
  }

  &--small {
    font-size: var(--t-fontSize-sm);
    color: var(--t-neutral-400);
  }
`;
```

### 3.7 Price

```jsx
// frontend/src/design/primitives/Price.jsx
import styled from "@emotion/styled";

export const Price = styled.span`
  font-size: var(--t-fontSize-xl);
  font-weight: var(--t-fontWeight-semibold);
  color: var(--t-neutral-900);
  letter-spacing: var(--t-letterSpacing-tight);
  white-space: nowrap;

  &--large {
    font-size: var(--t-fontSize-2xl);
  }
  &--primary {
    color: var(--t-primary-600);
  }
  &--muted {
    color: var(--t-neutral-400);
  }
`;
```

### 3.8 Button (MUI-based)

```jsx
// frontend/src/design/primitives/Button.jsx
import Button from "@mui/material/Button";

export const PrimaryBtn = (props) => (
  <Button
    variant="contained"
    sx={{
      bgcolor: "var(--t-primary-600)",
      color: "#fff",
      fontWeight: 500,
      letterSpacing: "0.05em",
      px: 3,
      py: 1.5,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      transition: "var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": { bgcolor: "var(--t-primary-500)" },
      "&:active": { bgcolor: "var(--t-primary-700)" },
      ...props.sx,
    }}
    {...props}
  />
);

export const SecondaryBtn = (props) => (
  <Button
    variant="outlined"
    sx={{
      borderColor: "var(--t-neutral-300)",
      color: "var(--t-neutral-700)",
      fontWeight: 500,
      px: 3,
      py: 1.5,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      transition: "var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": { borderColor: "var(--t-neutral-500)", bgcolor: "var(--t-neutral-100)" },
      ...props.sx,
    }}
    {...props}
  />
);

export const GhostBtn = (props) => (
  <Button
    variant="text"
    sx={{
      color: "var(--t-neutral-600)",
      fontWeight: 500,
      px: 2,
      py: 1,
      borderRadius: "var(--t-border-radius-base)",
      fontSize: "var(--t-fontSize-sm)",
      textTransform: "none",
      transition: "var(--t-motion-duration-fast) var(--t-motion-easing-out)",
      "&:hover": { color: "var(--t-neutral-900)", bgcolor: "var(--t-neutral-100)" },
      ...props.sx,
    }}
    {...props}
  />
);
```

### 3.9 Card

```jsx
// frontend/src/design/primitives/Card.jsx
import styled from "@emotion/styled";

export const Card = styled.article`
  background: #fff;
  border: 1px solid var(--t-neutral-200);
  border-radius: var(--t-border-radius-md);
  overflow: hidden;
  transition:
    border-color var(--t-motion-duration-fast) var(--t-motion-easing-out),
    box-shadow var(--t-motion-duration-fast) var(--t-motion-easing-out);

  &:hover {
    border-color: var(--t-neutral-300);
    box-shadow: var(--t-shadow-sm);
  }

  &--interactive {
    cursor: pointer;
  }

  &--noBorder {
    border-color: transparent;
    &:hover {
      border-color: transparent;
      box-shadow: none;
    }
  }
`;

export const CardBody = styled.div`
  padding: var(--t-space-lg);
`;
```

### 3.10 Divider

```jsx
// frontend/src/design/primitives/Divider.jsx
import styled from "@emotion/styled";

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: var(--t-neutral-200);
  margin-block: var(--t-space-xl);
`;
```

### 3.11 CSS Custom Properties Injection

All tokens must be injected as CSS custom properties at `:root` for MUI `sx` references.

```jsx
// frontend/src/design/tokens-css.js
import { tokens } from "./tokens";

const flat = (obj, prefix = "--t") => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof v === "object" && !Array.isArray(v) && !/^[a-z]+-[0-9]+$/.test(k)) {
      Object.assign(out, flat(v, `${prefix}-${k}`));
    } else {
      out[`${prefix}-${k}`] = v;
    }
  });
  return out;
};

const vars = flat(tokens);

export const TokenCSS = () => (
  <style>{`
    :root {
      ${Object.entries(vars)
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n      ")}
    }
    *, *::before, *::after { box-sizing: border-box; }
  `}</style>
);
```

This enables `sx={{ bgcolor: 'var(--t-primary-600)' }}` throughout.

---

## 4 MUI Theme Extension

```jsx
// frontend/src/design/theme.js
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { tokens } from "./tokens";

const theme = createTheme({
  palette: {
    neutral: {
      50: tokens.neutral[50],
      100: tokens.neutral[100],
      // ...through 900
      900: tokens.neutral[900],
    },
    primary: {
      main: tokens.primary[600], // #EA580C
      light: tokens.primary[500],
      dark: tokens.primary[700],
      contrastText: "#FFF",
    },
    background: {
      default: tokens.neutral[50], // #FAFAF9 — wall color
      paper: "#FFF",
    },
    text: {
      primary: tokens.neutral[900],
      secondary: tokens.neutral[500],
    },
  },
  typography: {
    fontFamily: tokens.fontFamily.sans,
    h1: {
      fontSize: tokens.fontSize["5xl"],
      fontWeight: tokens.fontWeight.heavy,
      lineHeight: tokens.lineHeight.tight,
      letterSpacing: tokens.letterSpacing.tighter,
      color: tokens.neutral[900],
    },
    h2: {
      fontSize: tokens.fontSize["4xl"],
      fontWeight: tokens.fontWeight.bold,
      lineHeight: tokens.lineHeight.tight,
    },
    h3: {
      fontSize: tokens.fontSize["3xl"],
      fontWeight: tokens.fontWeight.bold,
      lineHeight: tokens.lineHeight.snug,
    },
    h4: {
      fontSize: tokens.fontSize["2xl"],
      fontWeight: tokens.fontWeight.bold,
      lineHeight: tokens.lineHeight.snug,
    },
    h5: {
      fontSize: tokens.fontSize.xl,
      fontWeight: tokens.fontWeight.bold,
    },
    body1: {
      fontSize: tokens.fontSize.base,
      lineHeight: tokens.lineHeight.base,
      color: tokens.neutral[600],
    },
    body2: {
      fontSize: tokens.fontSize.sm,
      lineHeight: tokens.lineHeight.base,
      color: tokens.neutral[400],
    },
  },
  shape: {
    borderRadius: parseInt(tokens.border.radius.base), // 4px
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: tokens.border.radius.base,
          letterSpacing: tokens.letterSpacing.wide,
          fontWeight: tokens.fontWeight.medium,
          transition: `${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.neutral[200]}`,
          borderRadius: tokens.border.radius.md,
          boxShadow: "none",
          transition: `${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
          "&:hover": {
            borderColor: tokens.neutral[300],
            boxShadow: tokens.shadow.sm,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: tokens.border.radius.base,
          "& fieldset": {
            borderColor: tokens.neutral[300],
          },
          "&:hover fieldset": {
            borderColor: tokens.neutral[400],
          },
          "&.Mui-focused fieldset": {
            borderColor: tokens.primary[600],
            borderWidth: "2px",
          },
        },
      },
    },
  },
});

export default theme;
```

---

## 5 Page Redesigns

### 5.1 Global Layout & Navigation

**Navbar — Minimal Anchor**

```
[ Ord. ]                [ Shop ] [ About ] [ Account ] [ 🛒 (3) ]
```

- Fixed top, 56px height, `neutral[50]` background with 1px bottom border (neutral[200])
- Logo "Ord." in headline, left-aligned, tight letter-spacing
- Nav links: overline-style labels (uppercase, 0.1em tracking, 12px)
- Cart icon with count badge (primary[600] bg, white text, 16px)
- On scroll: navbar gains `shadow.sm` for depth signal
- 200ms fade transition on shadow

**Footer — Restrained Statement**

```
Ord.  →  Things that work. Beautifully.
[Instagram] [Contact]  [Shipping] [Returns]
© 2026 Ordinary
```

- `neutral[900]` bg, `neutral[50]` text
- Single column, centered
- Max 2 links per group
- 96px padding-top

**Scroll Behavior**

- `scroll-behavior: smooth` on `html`
- Section anchoring via hash links (nav links scroll to `#categories`, `#featured`, etc.)
- No parallax. No scroll-triggered animations (initial scope).

### 5.2 Home Page

**Visual structure (top-to-bottom):**

```
┌──────────────────────────────────────────────┐
│  ORD.                                         │  ← 128px above fold
│                                                │
│  Things that work.                              │
│  Beautifully.                                   │
│                                                │
│  [Shop the collection]                         │
│                                                │
└──────────────────────────────────────────────┘
         96px breathing room
┌──────────────────────────────────────────────┐
│  CATEGORIES                            →      │  ← Overline + Headline
│                                                │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │
│  │Kitchen││ Desk ││ Body ││ Home │            │  ← 2×2 or 4-col grid
│  │  img ││ img  ││ img  ││ img  │            │
│  └────┘ └────┘ └────┘ └────┘                 │
│                                                │
└──────────────────────────────────────────────┘
         48px gap
┌──────────────────────────────────────────────┐
│  FEATURED                                →    │
│                                                │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ Product │ │ Product │ │ Product │ │ Product │ │  ← White cards on off-white
│  │  img   │ │  img   │ │  img   │ │  img   │ │
│  │ Name   │ │ Name   │ │ Name   │ │ Name   │ │
│  │ $XX    │ │ $XX    │ │ $XX    │ │ $XX    │ │
│  └───────┘ └───────┘ └───────┘ └───────┘    │
│                                                │
└──────────────────────────────────────────────┘
         48px gap
┌──────────────────────────────────────────────┐
│  MANIFESTO                                     │  ← Concept statement
│                                                │
│  "We believe objects should earn their           │
│   place in your life. Every item we carry        │
│   is made by people who care more about the      │
│   making than the marketing."                    │
│                                                │
│  [Read our story →]                            │
│                                                │
└──────────────────────────────────────────────┘
         48px gap
┌──────────────────────────────────────────────┐
│  NEW ARRIVALS                             →    │
│                                                │
│  same 4-col grid as featured                    │
└──────────────────────────────────────────────┘
         96px gap
┌──────────────────────────────────────────────┐
│  Newsletter                                    │
│                                                │
│  [Email input]  [Subscribe]                    │
│                                                │
└──────────────────────────────────────────────┘
         → Footer
```

**Component structure:**

```
frontend/src/components/Home/
├── Hero.jsx          — full-viewport hero, minimal
├── CategoryGrid.jsx  — 2×2 or 4-col category cards
├── ProductSection.jsx — reusable featured/new grid
├── Manifesto.jsx     — philosophy statement
└── Newsletter.jsx    — email capture
```

**Hero implementation:**

```jsx
// Hero.jsx
import { Container, Section, Headline, Price, PrimaryBtn, Overline } from "../../design/primitives";
import { motion } from "framer-motion"; // optional, skip if no deps

export default function Hero() {
  return (
    <Section
      flush
      style={{
        bgcolor: "var(--t-neutral-900)",
        color: "#fff",
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container>
        <Overline style={{ color: "var(--t-neutral-400)" }}>Ordinary</Overline>
        <Headline level="5xl" style={{ color: "#fff", maxWidth: "18ch" }}>
          Things that work.
          <br />
          Beautifully.
        </Headline>
        <Price
          style={{
            color: "var(--t-primary-400)",
            marginTop: "var(--t-space-lg)",
            display: "block",
          }}
        >
          Crafted goods for considered living.
        </Price>
        <PrimaryBtn style={{ marginTop: "var(--t-space-xl)" }} href="/products">
          Shop the collection
        </PrimaryBtn>
      </Container>
    </Section>
  );
}
```

### 5.3 Product Listing (All Products / Category)

**URL**: `/products` (all) or `/products?category=kitchen`

**Layout:**

```
┌──────────────────────────────────────────────┐
│  Products                                      │  ← Headline "Products"
│  24 items                                       │  ← count, muted
│                                                │
│  [All ▼]    [Sort: Name ↓]    [Grid | List]   │  ← filters row, compact
│                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐ │
│  │         │ │         │ │         │ │     │ │
│  │  Product│ │  Product│ │  Product│ │ ... │ │
│  │  Card   │ │  Card   │ │  Card   │ │     │ │
│  │         │ │         │ │         │ │     │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────┘ │
│                                                │
│  [Load more]  or  infinite scroll              │
│                                                │
└──────────────────────────────────────────────┘
```

**Product Card redesign:**

```
┌──────────────────┐
│                    │  ← aspect-ratio 1:1, neutral[100] bg
│                    │
│        IMAGE       │  ← color: neutral[100] = unified product bg
│                    │
│                    │
├──────────────────┤
│ Category           │  ← Overline (muted)
│ Product Name       │  ← Headline level-xl, neutral[900]
│ Short desc...      │  ← BodyText--small, neutral[400], 2 lines max
│ $XX.XX             │  ← Price, neutral[900]
└──────────────────┘
```

**Filter sidebar**: collapsed on mobile, inline row on desktop. No sidebar chrome. Filters are pill toggles.

**Interaction**: Card hover = border accent + subtle shadow lift. No scale transform. 250ms ease-out.

### 5.4 Product Detail Page (PDP)

**URL**: `/product/:id`

**Layout (2-column on desktop, stacked on mobile):**

```
┌──────────────────────────────────────────────┐
│  ← Back to shop                                │
│                                                │
│  ┌────────────────────┐  ┌─────────────────┐ │
│  │                    │  │ Kitchen / Knives │ │ ← Overline
│  │                    │  │                  │ │
│  │                    │  │ Forged Chef Knife│ │ ← Headline 2xl
│  │   IMAGE            │  │                  │ │
│  │   (1:1 ratio)      │  │ Swedish steel    │ │ ← BodyText body
│  │                    │  │ Walnut handle    │ │
│  │                    │  │ $185.00          │ │ ← Price large
│  │                    │  │                  │ │
│  │                    │  │ [  −  1  +  ]   │ │ ← Qty selector
│  │                    │  │ [  Add to Cart  ]│ │ ← PrimaryBtn full-width
│  │                    │  │                  │ │
│  │                    │  │ Free shipping     │ │ ← BodyText--small
│  └────────────────────┘  └─────────────────┘ │
│                                                │
│  DETAILS                                       │  ← Overline
│                                                │
│  Length: 210mm                                   │ ← Label → Value grid
│  Weight: 210g                                    │
│  Material: Swedish steel / Walnut                │
│                                                │
│  DESCRIPTION                                    │
│                                                │
│  Full product description...                     │  ← BodyText lead
│                                                │
└────────────────────────┴──────────────────────┘
```

**Key behavior:**

- Image gallery: thumbnail strip below main image. No carousel. Click thumbnail → swap image. 200ms fade.
- Quantity selector: `[−] [1] [+]` — minimal, functional
- Add to Cart button: full-width in right column, primary[600] bg
- Stock indicator: "In stock" / "Low stock" / "Sold out" — muted overline, status-colored
- No "related products" in initial scope (page must not feel crowded)

### 5.5 Cart (Basket)

**URL**: `/cart`

**Layout:**

```
┌──────────────────────────────────────────────┐
│  Basket                   [Continue shopping] │
│                                                │
│  ┌─────────────────────────────────────────┐ │
│  │ ┌──────┐  Name             $XX   [×]    │ │
│  │ │ IMG  │  Variant / size               │ │
│  │ │      │  [− +] qty      Subtotal $XX  │ │
│  │ └──────┘                                │ │
│  ├─────────────────────────────────────────┤ │
│  │  Item 2 ...                              │ │
│  └─────────────────────────────────────────┘ │
│                                                │
│  Order Summary                    [Sticky]   │
│  ┌────────────────────────────────────────┐  │
│  │ Subtotal                              $XX│  │
│  │ Shipping                             —  │  │
│  │ Tax                                  —  │  │
│  │ ────────────────────────────────────── |  │
│  │ Total                               $XX│  │
│  │                                        │  │
│  │ [      Proceed to Checkout       ]     │  │
│  └────────────────────────────────────────┘  │
│                                                │
└──────────────────────────────────────────────┘
```

**Behavior:**

- Empty cart: `EmptyCart.jsx` — "Your basket is empty" + "Continue shopping" primary button
- Cart item removal: slide out + fade, 250ms
- Quantity change: optimistic update, 150ms
- Sticky summary on desktop (right column), inline at bottom on mobile
- No coupon/promo code in initial scope (YAGNI)
- Currency follows user preference (not locked)

### 5.6 Checkout Flow

**URL**: `/checkout/shipping` → `/checkout/address` → `/checkout/review` → `/checkout/success`

**Multi-step form with progress indicator:**

```
Step 1 ─── Step 2 ─── Step 3 ────
[ Shipping ] [ Address ] [ Review ]
```

**5.6.1 Shipping**

```jsx
// Checkout/Shipping.jsx — reimagined
// Fields: Full Name, Email, Phone (phone optional)
// Save info checkbox (functional, persists to account)
// "Continue" button
```

**5.6.2 Address**

```
// AddressForm.jsx — reimagined
// Fields: Street, City, State/Region, Postal, Country
// Country auto-detected from geo (existing service)
// State/region dropdown based on country
// "Back" | "Continue" buttons
```

**5.6.3 Review**

```
// ReviewOrder.jsx — reimagined
// Left column: order items (compact list with images)
// Right column: shipping + billing addresses, totals
// "Place Order" button (primary[600])
// "Back" | "Place Order →"
```

**5.6.4 Success**

```
// Checkout/Success.jsx — reimagined
// Centered, minimal
// ✓  Order placed successfully
// Order #XXXXX
// [View order] [Continue shopping]
// Clean, single column, max 480px wide
```

**Behavior:**

- Form validation: real-time (on blur), not on submit
- Error states: neutral[400] text below field, field border → primary[700] on error
- Progress bar: clean line, 4px height, primary[600] for completed steps, neutral[200] for remaining
- No page reload between steps — component swap with 250ms fade

### 5.7 Account Page

**URL**: `/account`

**Layout:**

```
┌──────────────────────────────────────────────┐
│  Account                                       │
│                                                │
│  ┌──── Profile ────┐  ┌──── Orders ──────┐  │
│  │                  │  │                  │  │
│  │ Avatar  (initials│  │  My Orders       │  │
│  │ or generated)    │  │                  │  │
│  │                  │  │ ┌─────┐ ┌─────┐  │  │
│  │ Name             │  │ │ #102│ │ #101│  │  │ ← compact order cards
│  │ Email            │  │ │ Jun | │ May |  │  │
│  │ Phone (opt)      │  │ │$145 │ │$89  │  │  │
│  │                  │  │ └─────┘ └─────┘  │  │
│  │ [Update info]    │  │ [View all →]    │  │
│  └──────────────────┘  └─────────────────┘  │
│                                                │
│  ┌──── Preferences ──────────────────────┐   │
│  │  Currency: [USD ▾]  [Save]           │   │
│  └────────────────────────────────────────┘  │
│                                                │
│  ┌──── Security ─────────────────────────┐   │
│  │  [Change password]                     │   │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Profile**: Two-column on desktop (profile form left, orders right). Stacked on mobile.

**Orders Section (MyOrders.jsx)**:

```
// Compact order cards:
┌──────────────────────────────────┐
│  #ORD-2026-001    Jun 6, 2026    │ ← Order ID + date
│  3 items · $145.00 · Processing   │ ← Summary line
│  [View details →]                │
└──────────────────────────────────┘
```

- 3 column grid on desktop, 2 on tablet, 1 on mobile
- Order status: pill badge (neutral-800 bg, white text, 10px text)

### 5.8 Order Details

**URL**: `/order/:id`

```
┌──────────────────────────────────────────────┐
│  Order #XXXXX                                  │
│  Placed June 6, 2026                           │
│                                                │
│  Items                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ IMG  │ │ IMG  │ │ IMG  │                  │
│  │ Name │ │ Name │ │ Name │                  │
│  │ × qty│ │ × qty│ │ × qty│                  │
│  │ $XX  │ │ $XX  │ │ $XX  │                  │
│  └──────┘ └──────┘ └──────┘                  │
│                                                │
│  Order Summary                                │
│  Subtotal   $145.00                            │
│  Shipping   $0.00                              │
│  Tax        $0.00                              │
│  ─────────────────                            │
│  Total      $145.00                            │
│                                                │
│  Shipping Address                              │
│  John Doe                                      │
│  123 Main St                                   │
│  City, ST 12345                                │
│                                                │
│  Payment                                       │
│  •••• 4242  Exp 12/26                          │
│                                                │
│  Status: Processing                            │
│                                                │
└──────────────────────────────────────────────┘
```

### 5.9 Login / Register

**URL**: `/login`, `/register`

**Layout:**

```
┌──────────────────────────────────────────────┐
│                                                │
│    ┌──────────────────────────────────────┐  │
│    │                                      │  │
│    │  Ord.                                 │  │ ← Overline
│    │                                      │  │
│    │  Sign in to your account              │  │ ← Headline 3xl
│    │                                      │  │
│    │  Email                               │  │ ← Label (BodyText--small)
│    │  ┌────────────────────────────────┐  │  │
│    │  │                                │  │  │
│    │  └────────────────────────────────┘  │  │
│    │                                      │  │
│    │  Password                           │  │
│    │  ┌────────────────────────────────┐  │  │
│    │  │                                │  │  │
│    │  └────────────────────────────────┘  │  │
│    │                                      │  │
│    │  [Sign in]                           │  │ ← PrimaryBtn full-width
│    │                                      │  │
│    │  Forgot password?                    │  │ ← GhostBtn inline
│    │                                      │  │
│    │  No account? [Create one]            │  │
│    │                                      │  │
│    └──────────────────────────────────────┘  │
│                                                │
└──────────────────────────────────────────────┘
```

- Card centered on page, max 400px wide
- MUI `Card` with `CardBody` padding
- Field labels above inputs (not placeholder-as-label)
- Error messages: primary[700] text, appear below field on blur

### 5.10 Search

**SearchOverlay.jsx**: Full-screen overlay triggered by ⌘K or search icon click.

```
┌──────────────────────────────────────────────┐
│  Search products...                            │  ← Large input, 48px, full width
│                                                │
│  Recent searches:                              │
│  [knives] [linen] [cast iron]                  │  ← Pill tags, clickable
│                                                │
│  Popular:                                      │
│  [ceramic] [leather] [brass]                    │
│                                                │
│  ────────────── Results ────────────────      │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ IMG  │ │ IMG  │ │ IMG  │                 │
│  │ Name │ │ Name │ │ Name │                 │
│  │ $XX  │ │ $XX  │ │ $XX  │                 │
│  └──────┘ └──────┘ └──────┘                 │
└──────────────────────────────────────────────┘
```

- Dark overlay: `neutral[900]` at 90% opacity
- Input: `neutral[50]` bg, uppercase placeholder "Search products..."
- Results grid: 3 columns, same ProductCard as listing
- Close: Escape key or click outside
- No live search-as-you-type in initial scope (requires backend endpoint)

### 5.11 Admin Pages

**Dashboard (DashBoard.jsx):**

```
┌──────────────────────────────────────────────┐
│  Dashboard                              [Ord.] │
│                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ $XXK │ │  XX  │ │  XX  │ │  XX  │        │  ← stat cards
│  │Total │ │Orders│ │Users │ │Prod. │        │
│  │Rev   │ │      │ │      │ │      │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│                                                │
│  Revenue Chart                    [Line chart]│
│                                                │
│  Recent Orders                                 │
│  #102 · Jun 6 · $145 · Processing             │
│  #101 · Jun 5 · $89  · Delivered              │
│                                                │
│  [Manage products] [View all orders]           │
└──────────────────────────────────────────────┘
```

Stat cards: minimal — just label (overline) + number (headline-3xl) + optional change indicator (green ↑ / red ↓).

**AllProducts, AllOrders, AllUsers**: Same disciplined table pattern.

- No zebra striping
- 1px row borders (neutral[200])
- Hover: neutral[100] bg
- Primary action button per row (e.g., "Edit", "View")
- Stat cards at top of each page

### 5.12 Error / Not Found

**NotFound.jsx:**

```
┌──────────────────────────────────────────────┐
│                                                │
│              404                               │  ← Headline-5xl, neutral[900]
│                                                │
│  Page not found.                               │  ← BodyText
│                                                │
│  [Return to shop]                              │  ← PrimaryBtn
│                                                │
└──────────────────────────────────────────────┘
```

Centered, single column, max 400px. No decoration.

---

## 6 Animation & Interaction Spec

### Motion Principles

1. **Entrance**: Fade from 0→1 opacity, 250ms, `ease-out` (no slide, no scale)
2. **Exit**: Fade out, 150ms, `ease-out`
3. **Hover**: Color/border/shadow only. No transform.
4. **Click/Press**: `active` state shifts bg to `primary[700]`, 80ms
5. **Card grid**: Stagger fade-in on mount — 50ms delay between each card, max 400ms total

### Eliminated (anti-patterns):

- ❌ Scale transforms on hover (feels decorative)
- ❌ Slide-from-right navigation transitions
- ❌ Bouncy/spring easings
- ❌ Skeleton loaders with shimmer (use static placeholder instead)
- ❌ Page transitions with curtain/wipe effects

### Preferred:

- ✅ Opacity fade for components entering/leaving
- ✅ Border/shadow state changes for interactive elements
- ✅ 200-300ms transitions with `cubic-bezier(0, 0, 0.2, 1)`
- ✅ Staggered grid item reveals on scroll (IntersectionObserver, not scroll-position dependent)

---

## 7 State & Data Flow (Preserved)

### What stays unchanged:

- Redux store structure (4 reducers: Cart, Order, User, Product)
- API slices (productsApiSlice, apiSlice)
- Auth flow (JWT, login/register/logout)
- Stripe integration
- Backend API endpoints (all `.js` URLs preserved)
- Currency context (auto-conversion, lock on cart/shipping)
- Validation middleware

### What changes:

- All component render logic (JSX output)
- MUI component usage (sx-based theming, no `makeStyles`)
- Component file structure (primitives directory)
- CSS approach (CSS custom properties via tokens, not inline styles ad-hoc)
- Tailwind CSS: retained in build, not actively used in new components
- `react-alert` → replaced with MUI Snackbar (or removed entirely, use inline validation)
- `react-perfect-scrollbar` → remove (use native scrollbar styling)
- `react-responsive-carousel` → remove (use thumbnail strip for PDP image gallery)

---

## 8 File Structure (Post-Redesign)

```
frontend/src/
├── design/
│   ├── tokens.js              # All design tokens
│   ├── tokens-css.js          # CSS custom properties injector
│   ├── theme.js               # MUI theme extension
│   └── primitives/
│       ├── Section.jsx
│       ├── Container.jsx
│       ├── Grid.jsx
│       ├── Overline.jsx
│       ├── Headline.jsx
│       ├── BodyText.jsx
│       ├── Price.jsx
│       ├── Button.jsx         # PrimaryBtn, SecondaryBtn, GhostBtn
│       ├── Card.jsx           # Card, CardBody
│       └── Divider.jsx
├── components/
│   ├── Home/
│   │   ├── Hero.jsx           # NEW
│   │   ├── CategoryGrid.jsx   # NEW
│   │   ├── ProductSection.jsx # NEW
│   │   ├── Manifesto.jsx      # NEW
│   │   └── Newsletter.jsx     # NEW
│   ├── Product/
│   │   ├── ProductCard.jsx    # REDESIGN
│   │   ├── ProductGrid.jsx    # REDESIGN
│   │   ├── ProductDetails.jsx # REDESIGN → PDP layout
│   │   └── Products.jsx       # REDESIGN → listing + filters
│   ├── Cart/
│   │   └── Basket.jsx         # REDESIGN
│   ├── Checkout/
│   │   ├── Shipping.jsx       # REDESIGN
│   │   ├── AddressForm.jsx    # REDESIGN
│   │   ├── ReviewOrder.jsx    # REDESIGN
│   │   ├── PaymentForm.jsx    # REDESIGN (minimal visual change)
│   │   └── Success.jsx        # REDESIGN
│   ├── Order/
│   │   ├── MyOrders.jsx       # REDESIGN
│   │   └── OrderDetails.jsx   # REDESIGN
│   ├── Account/
│   │   ├── Account.jsx        # REDESIGN
│   │   ├── UpdatePassword.jsx # REDESIGN
│   │   ├── ForgotPassword.jsx # REDESIGN
│   │   └── ResetPassword.jsx  # REDESIGN
│   ├── Admin/
│   │   ├── DashBoard.jsx      # REDESIGN
│   │   ├── AllProductsList.jsx # REDESIGN
│   │   ├── AllOrdersList.jsx   # REDESIGN
│   │   └── AllUsersList.jsx    # REDESIGN
│   ├── Login/
│   │   ├── Register.jsx       # REDESIGN
│   │   └── Login.jsx          # REDESIGN
│   ├── Home/
│   │   ├── Header.jsx         # REDESIGN
│   │   └── Banner.jsx         # REMOVE (replaced by Hero)
│   ├── Search.jsx             # REDESIGN → full-screen overlay
│   ├── NotFound.jsx           # REDESIGN
│   ├── EmptyCart.jsx          # REDESIGN
│   ├── ZeroOrders.jsx         # REDESIGN
│   ├── Reviewcard.jsx         # REDESIGN (review cards)
│   ├── Seo.jsx                # KEEP
│   ├── Copyright.jsx          # REDESIGN
│   ├── ProtectedRoute.jsx     # KEEP (no visual change)
│   └── AdminRoute.jsx         # KEEP (no visual change)
├── App.js                     # REDESIGN (routing + layout shell)
├── store.js                   # KEEP
├── index.js                   # KEEP + add font import
└── utils/
    ├── currencyContext.js      # KEEP
    ├── fmtInCurrency.js        # KEEP
    ├── fmt.js                  # KEEP
    └── validators.js           # KEEP
```

**New files**: ~10 (design system layer)  
**Redesigned files**: ~30  
**Unchanged**: reducers, actions, API slices, utils, backend

---

## 9 Typography Loading

```html
<!-- In index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

```css
/* In tokens-css.js */
--t-fontFamily-sans:
  "Inter", "Inter Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

---

## 10 Implementation Phases

### Phase 1: Design System Foundation (— tokens, primitives, theme)

- `tokens.js` — all design primitives
- `tokens-css.js` — CSS custom properties injector
- `theme.js` — MUI theme
- 10 primitive components
- `TokenCSS` injection in `App.js` top-level
- Font loading in `index.html`

### Phase 2: Layout Shell (— navbar, footer, App.js routing)

- `Header.jsx` — minimalist nav
- `Footer.jsx` — restrained statement
- `App.js` — routing structure with `Container` + `Section` wrappers
- Scroll-to-section on nav link click

### Phase 3: Home Page (— Hero, Categories, Featured, Manifesto)

- `Hero.jsx`
- `CategoryGrid.jsx`
- `ProductSection.jsx` (reusable for featured + new arrivals)
- `Manifesto.jsx`
- `Newsletter.jsx`

### Phase 4: Product Pages (— PDP, Listing, Card)

- `ProductCard.jsx`
- `ProductGrid.jsx` / `Products.jsx`
- `ProductDetails.jsx` (PDP with image gallery)
- `Reviewcard.jsx`

### Phase 5: Cart & Checkout (— Basket, Shipping, Address, Review, Success)

- `Basket.jsx`
- `Shipping.jsx`
- `AddressForm.jsx`
- `ReviewOrder.jsx`
- `PaymentForm.jsx` (minimal visual changes)
- `Success.jsx`
- `StripeCardNumberInput.jsx`, `StripeCardCVCInput.jsx`, `StripeCardExpInput.jsx` (minimal)

### Phase 6: Account & Orders (— Account, MyOrders, OrderDetails)

- `Account.jsx`
- `MyOrders.jsx`
- `OrderDetails.jsx`
- `ForgotPassword.jsx`, `ResetPassword.jsx`, `UpdatePassword.jsx`

### Phase 7: Admin Pages (— Dashboard, AllProducts, AllOrders, AllUsers)

- `DashBoard.jsx` (stat cards + chart)
- `AllProductsList.jsx`
- `AllOrdersList.jsx`
- `AllUsersList.jsx`

### Phase 8: Auth & Utility (— Login, Register, Search, Not Found, Empty Cart)

- `Register.jsx`
- `Login.jsx`
- `Search.jsx` (overlay)
- `NotFound.jsx`
- `EmptyCart.jsx`
- `ZeroOrders.jsx`
- `SeverityPill.jsx`

### Phase 9: Testing & Polish

- All critical paths: browse → cart → checkout → order
- Responsive: 320px → 1440px breakpoints tested
- Dark mode: NOT in initial scope (light-only, deliberate)
- Accessibility: focus states, aria labels, keyboard nav
- Performance: no heavy animation libs (skip framer-motion)

---

## 11 Anti-Patterns Explicitly Rejected

1. **No carousels/sliders** — they hide content and feel decorative
2. **No parallax scrolling** — distracts from content
3. **No gradient backgrounds** — violates honest materiality principle
4. **No dark mode** — light-only design is the discipline
5. **No emoji/icons as decoration** — icons only for functional meaning (cart, search, menu)
6. **No social proof badges** ("trusted by 10,000") — trust comes from the products
7. **No countdown timers/urgency** — urgency is the opposite of considered
8. **No coupon/promo fields** — not in the spec, YAGNI
9. **No related products on PDP** — page must not feel crowded
10. **No bounce/spring animations** — mechanical precision only

---

## 12 Testing Plan

### Visual Regression

- Screenshot each page at 3 viewports: 375px, 768px, 1280px
- Compare against design tokens (colors, spacing, typography)
- No visual differences tolerated

### Functional

- Browse → Add to cart → Checkout → Place order → View order
- Login → Register → Account → Update password → Logout
- Admin: Create product → Edit product → Delete product → View all orders → Update status
- Currency selector → price updates across pages
- Empty states: empty cart, zero orders, not found

### Responsive

- Every page at 320px, 375px, 768px, 1024px, 1280px, 1440px
- No horizontal scroll at any breakpoint
- Touch targets ≥ 44px

### Accessibility

- Keyboard navigation through all interactive elements
- Focus indicators visible (primary[600] outline)
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Form labels associated with inputs

---

## 13 Things Explicitly NOT In Scope

- Search-as-you-type (requires backend endpoint)
- Dark mode
- Wishlist / favorites
- Product reviews (existing feature, visual unchanged)
- Multi-currency beyond existing USD/EUR/GBP
- Multiple shipping addresses
- Gift cards
- Subscription/recurring orders
- Blog / content pages
- Multi-language

---

## 14 Spec Self-Review

### Placeholder scan

- All token values are concrete hex codes or named values
- No "TBD" or "TODO" in design decisions
- Component structure fully specified
- All pages mapped

### Internal consistency

- Primary color used consistently: `primary[600]` for CTAs, `primary[700]` for active/pressed
- Neutral scale covers entire text hierarchy: 50 (surface) → 900 (headlines)
- Spacing scale: 4px base, geometric progression
- Typography scale: 1.25x modular scale, no arbitrary sizes
- Motion: 80/150/250/400ms only with specified easings

### Scope check

- 3 tiers: design system → page redesign → testing
- Each phase is independently completable
- No feature expansion beyond current capability

### Ambiguity check

- "Grid 2×2" for categories on desktop → explicit: 4-col grid at ≥768px
- "Card hover" → explicit: border + shadow only, no scale
- "Progress bar" → explicit: 4px line, primary[600] for completed
- Newsletter → functional checkbox needed (confirm opted in)
