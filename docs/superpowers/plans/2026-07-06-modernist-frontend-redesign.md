# Modernist Frontend Redesign Implementation Plan

**Date:** 2026-07-06
**Goal:** Redesign `Ordinary` MERN e-commerce frontend with cohesive Modernist design system
**Architecture:** Design tokens → CSS custom properties → MUI theme → primitive components → page redesign
**Tech Stack:** React 17, MUI v5, emotion/styled, Redux Toolkit, CSS custom properties

## Global Constraints

- Store named "Ordinary", tagline "Things that work. Beautifully."
- Primary accent: `#EA580C` (terracotta); neutral base: warm off-white → charcoal
- Typography: Inter font, 1.25x modular scale, geometric sans-serif
- Motion: 200-300ms, `cubic-bezier(0, 0, 0.2, 1)`, opacity fades only
- NO bounce, NO parallax, NO scale transforms, NO carousels, NO lattice animations
- No commits or pushes until user says so
- Full test verification after each major phase
- Design system first, then page-by-page rewrite

---

## Phase 0: Project Setup

### Task 0.1: Add Inter font loading & global CSS reset

**Files:**

- Modify: `frontend/public/index.html` head section
- Modify: `frontend/src/index.css`

**Step 1:** Add to `public/index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

**Step 2:** Replace `frontend/src/index.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #57534e;
  background-color: #fafaf9;
  overflow-x: hidden;
}
::selection {
  background-color: rgba(234, 88, 12, 0.15);
  color: #1c1917;
}
:focus-visible {
  outline: 2px solid #ea580c;
  outline-offset: 2px;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

**Test:** Run `npm start --prefix frontend` — no CSS errors. Font loads.
**No commit.**

---

## Phase 1: Design System Foundation

### Task 1.1: Create design tokens file

**Files:**

- Create: `frontend/src/design/tokens.js`

**Content:** Full token specification from approved spec Section 2.

```js
// frontend/src/design/tokens.js
export const tokens = {
  neutral: {
    50: "#FAFAF9",
    100: "#F5F5F4",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917",
  },
  primary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },
  semantic: { success: "#15803D", warning: "#A16207", error: "#DC2626", info: "#1D4ED8" },
  fontFamily: {
    sans: '"Inter", "Inter Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 },
  lineHeight: { tight: 1.15, snug: 1.35, base: 1.6, loose: 1.75 },
  letterSpacing: {
    tighter: "-0.03em",
    tight: "-0.015em",
    normal: "0",
    wide: "0.05em",
    wider: "0.1em",
  },
  space: {
    xs: "0.5rem",
    sm: "0.75rem",
    base: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4rem",
    "3xl": "6rem",
    "4xl": "8rem",
  },
  motion: {
    duration: { instant: "80ms", fast: "150ms", base: "250ms", slow: "400ms" },
    easing: { out: "cubic-bezier(0, 0, 0.2, 1)", inOut: "cubic-bezier(0.4, 0, 0.2, 1)" },
  },
  grid: { columns: 12, gutter: "1.5rem", containerMax: "80rem", containerPad: "2rem" },
  border: {
    radius: { none: "0", sm: "2px", base: "4px", md: "6px", lg: "8px", full: "9999px" },
    width: { thin: "1px", base: "2px" },
  },
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(28,25,23,0.04)",
    base: "0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
    md: "0 4px 6px rgba(28,25,23,0.05), 0 2px 4px rgba(28,25,23,0.04)",
  },
  zIndex: { dropdown: 1000, sticky: 1100, overlay: 1200, modal: 1300, toast: 1400 },
};
export default tokens;
```

**Test:** `node -e "require('./src/design/tokens.js')"` from frontend dir — no errors.
**No commit.**

### Task 1.2: Create CSS custom properties injector

**Files:**

- Create: `frontend/src/design/tokens-css.js`

```jsx
// frontend/src/design/tokens-css.js
import React from "react";
import tokens from "./tokens";

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

export const TokenCSS = () => (
  <style>{`
    :root { ${Object.entries(flat(tokens))
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n      ")} }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
  `}</style>
);
```

**Test:** Import TokenCSS in test render, inspect `:root` in DevTools — all `--t-*` vars present.
**No commit.**

### Task 1.3: Create MUI theme extension

**Files:**

- Create: `frontend/src/design/theme.js`

```jsx
import { createTheme } from "@mui/material/styles";
import tokens from "./tokens";

const theme = createTheme({
  palette: {
    neutral: {
      50: tokens.neutral[50],
      100: tokens.neutral[100],
      200: tokens.neutral[200],
      300: tokens.neutral[300],
      400: tokens.neutral[400],
      500: tokens.neutral[500],
      600: tokens.neutral[600],
      700: tokens.neutral[700],
      800: tokens.neutral[800],
      900: tokens.neutral[900],
    },
    primary: {
      main: tokens.primary[600],
      light: tokens.primary[500],
      dark: tokens.primary[700],
      contrastText: "#FFF",
    },
    background: { default: tokens.neutral[50], paper: "#FFFFFF" },
    text: { primary: tokens.neutral[900], secondary: tokens.neutral[500] },
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
    h5: { fontSize: tokens.fontSize.xl, fontWeight: tokens.fontWeight.bold },
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
  shape: { borderRadius: parseInt(tokens.border.radius.base) },
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
          "&:hover": { borderColor: tokens.neutral[300], boxShadow: tokens.shadow.sm },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: tokens.border.radius.base,
          "& fieldset": { borderColor: tokens.neutral[300] },
          "&:hover fieldset": { borderColor: tokens.neutral[400] },
          "&.Mui-focused fieldset": { borderColor: tokens.primary[600], borderWidth: "2px" },
        },
      },
    },
  },
});
export default theme;
```

**Test:** Import theme, render MUI Button + Card — colors/typography reflect tokens.
**No commit.**

### Task 1.4: Create 10 design primitives

**Files:**

- Create: `frontend/src/design/primitives/Section.jsx`
- Create: `frontend/src/design/primitives/Container.jsx`
- Create: `frontend/src/design/primitives/Grid.jsx`
- Create: `frontend/src/design/primitives/Overline.jsx`
- Create: `frontend/src/design/primitives/Headline.jsx`
- Create: `frontend/src/design/primitives/BodyText.jsx`
- Create: `frontend/src/design/primitives/Price.jsx`
- Create: `frontend/src/design/primitives/Button.jsx`
- Create: `frontend/src/design/primitives/Card.jsx`
- Create: `frontend/src/design/primitives/Divider.jsx`

**Section.jsx:**

```jsx
import React from "react";
export const Section = ({ flush, tight, loose, style, ...props }) => {
  const pad = tight ? "var(--t-space-xl)" : loose ? "var(--t-space-3xl)" : "var(--t-space-2xl)";
  return <section style={{ width: "100%", paddingBlock: flush ? 0 : pad, ...style }} {...props} />;
};
```

**Container.jsx:**

```jsx
import React from "react";
export const Container = ({ children, ...props }) => (
  <div
    style={{
      maxWidth: "var(--t-grid-containerMax)",
      marginInline: "auto",
      paddingInline: "var(--t-grid-containerPad)",
      ...props.style,
    }}
    {...props}
  >
    {children}
  </div>
);
```

**Grid.jsx:**

```jsx
import React from "react";
export const Grid = ({ cols, gap, style, ...props }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : "repeat(12, 1fr)",
      gap: gap || "var(--t-grid-gutter)",
      ...style,
    }}
    {...props}
  />
);
```

**Overline.jsx:**

```jsx
import React from "react";
export const Overline = ({ as = "span", style, ...props }) => {
  const Tag = as;
  return (
    <Tag
      style={{
        fontSize: "var(--t-fontSize-xs)",
        fontWeight: 500,
        letterSpacing: "var(--t-letterSpacing-wider)",
        textTransform: "uppercase",
        color: "var(--t-neutral-400)",
        lineHeight: "var(--t-lineHeight-base)",
        display: "block",
        marginBottom: "var(--t-space-sm)",
        ...style,
      }}
      {...props}
    />
  );
};
```

**Headline.jsx:**

```jsx
import React from "react";
const levelStyles = {
  "5xl": `font-size:var(--t-fontSize-5xl);font-weight:var(--t-fontWeight-heavy);line-height:var(--t-lineHeight-tight);letter-spacing:var(--t-letterSpacing-tighter)`,
  "4xl": `font-size:var(--t-fontSize-4xl);font-weight:var(--t-fontWeight-bold);line-height:var(--t-lineHeight-tight)`,
  "3xl": `font-size:var(--t-fontSize-3xl);font-weight:var(--t-fontWeight-bold);line-height:var(--t-lineHeight-snug)`,
  "2xl": `font-size:var(--t-fontSize-2xl);font-weight:var(--t-fontWeight-bold);line-height:var(--t-lineHeight-snug)`,
  xl: `font-size:var(--t-fontSize-xl);font-weight:var(--t-fontWeight-bold);line-height:var(--t-lineHeight-snug)`,
};
export const Headline = ({ level = "3xl", style, ...props }) => (
  <h2
    style={{
      color: "var(--t-neutral-900)",
      ...(levelStyles[level] ? { cssText: levelStyles[level] } : {}),
      ...style,
    }}
    {...props}
  />
);
```

**BodyText.jsx:**

```jsx
import React from "react";
export const BodyText = ({ lead, small, style, ...props }) => (
  <p
    style={{
      fontSize: lead
        ? "var(--t-fontSize-lg)"
        : small
          ? "var(--t-fontSize-sm)"
          : "var(--t-fontSize-base)",
      lineHeight: lead ? "var(--t-lineHeight-loose)" : "var(--t-lineHeight-base)",
      color: lead
        ? "var(--t-neutral-700)"
        : small
          ? "var(--t-neutral-400)"
          : "var(--t-neutral-600)",
      maxWidth: lead ? "65ch" : undefined,
      ...style,
    }}
    {...props}
  />
);
```

**Price.jsx:**

```jsx
import React from "react";
export const Price = ({ large, primary, muted, style, ...props }) => (
  <span
    style={{
      fontSize: large ? "var(--t-fontSize-2xl)" : "var(--t-fontSize-xl)",
      fontWeight: 600,
      color: primary
        ? "var(--t-primary-600)"
        : muted
          ? "var(--t-neutral-400)"
          : "var(--t-neutral-900)",
      letterSpacing: "var(--t-letterSpacing-tight)",
      whiteSpace: "nowrap",
      ...style,
    }}
    {...props}
  />
);
```

**Button.jsx:**

```jsx
import React from "react";
import { Button as MuiButton } from "@mui/material";

export const PrimaryBtn = (props) => (
  <MuiButton
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
  <MuiButton
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
  <MuiButton
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

**Card.jsx:**

```jsx
import React from "react";
export const Card = ({ noBorder, interactive, style, ...props }) => (
  <article
    style={{
      background: "#fff",
      border: noBorder ? "1px solid transparent" : "1px solid var(--t-neutral-200)",
      borderRadius: "var(--t-border-radius-md)",
      overflow: "hidden",
      cursor: interactive ? "pointer" : "default",
      transition:
        "border-color 200ms cubic-bezier(0,0,0.2,1), box-shadow 200ms cubic-bezier(0,0,0.2,1)",
      ...style,
    }}
    {...props}
  />
);
export const CardBody = ({ children, ...props }) => (
  <div style={{ padding: "var(--t-space-lg)" }} {...props}>
    {children}
  </div>
);
```

**Divider.jsx:**

```jsx
import React from "react";
export const Divider = ({ style, ...props }) => (
  <hr
    style={{
      border: "none",
      height: "1px",
      background: "var(--t-neutral-200)",
      marginBlock: "var(--t-space-xl)",
      ...style,
    }}
    {...props}
  />
);
```

**Test:** Import all primitives in playground component. Each renders with correct default styles.
**No commit.**

---

## Phase 2: Layout Shell (Navbar, Footer, App.js)

### Task 2.1: Rewrite Header.jsx (Modernist nav)

**Files:**

- Modify: `frontend/src/components/Home/Header.js`

**Approach:** Preserve ALL business logic. Replace visual styling (Tailwind + MUI jest → CSS custom properties + primitives). Logo text "Ord." from "Click.it".

**Key style changes:**

- Fixed header, 56px mobile / 64px desktop
- Background `var(--t-neutral-50)` with 1px bottom border `var(--t-neutral-200)`
- Scroll adds `box-shadow: var(--t-shadow-sm)` with 200ms transition
- Logo "Ord." — 20px, weight 700, tight tracking
- Nav links: uppercase, 12px, weight 500, 0.1em letter-spacing, muted color
- Cart badge: primary-600 bg, white text
- Currency: Select styled to match nav links
- Mobile: hamburger opens side drawer (preserve existing SwipeableDrawer logic)
- Auth dropdown: PaperProps styled (elevation 0, no shadow, clean)

**Step 1:** Rewrite header `<header>` element with inline styles using CSS custom properties.
**Step 2:** Replace all `className="..."` Tailwind strings with style objects.
**Step 3:** Change "Click.it" → "Ord." in logo.
**Step 4:** Keep ALL event handlers, Redux dispatches, currency logic, drawer state — unchanged.

**Test:** Visit /, /products, /cart — header renders with clean Modernist styling. Scroll adds shadow. Mobile drawer works. Auth menu works.
**No commit.**

### Task 2.2: Create Footer.jsx

**Files:**

- Create: `frontend/src/components/Home/Footer.js`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Container } from "../design/primitives";
import { BodyText, Headline } from "../design/primitives";

const navLinks = [
  { label: "About", href: "/aboutus" },
  { label: "Shop", href: "/products" },
  { label: "Contact", href: "#" },
  { label: "Shipping", href: "/shipping" },
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--t-neutral-900)",
        color: "var(--t-neutral-400)",
        paddingBlock: "var(--t-space-3xl)",
      }}
    >
      <Container>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}
        >
          <div style={{ textAlign: "center" }}>
            <Link
              to="/"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--t-neutral-50)",
                textDecoration: "none",
                letterSpacing: "-0.03em",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Ord.
            </Link>
            <BodyText
              style={{ color: "var(--t-neutral-400)", letterSpacing: "0.05em", fontSize: "14px" }}
            >
              Things that work. Beautifully.
            </BodyText>
          </div>
          <nav style={{ display: "flex", gap: "32px" }}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                style={{
                  color: "var(--t-neutral-400)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <BodyText style={{ color: "var(--t-neutral-500)", fontSize: "12px", marginTop: "8px" }}>
            © 2026 Ordinary. All rights reserved.
          </BodyText>
        </div>
      </Container>
    </footer>
  );
}
```

**Test:** Pages render footer at bottom, links work.
**No commit.**

### Task 2.3: Wire design system into App.js

**Files:**

- Modify: `frontend/src/App.js`

**Changes:**

1. Import `{ TokenCSS }` from `./design/tokens-css`
2. Import `theme` from `./design/theme` (replacing inline createTheme)
3. Import `Footer` from `./components/Home/Footer`
4. Wrap with `<ThemeProvider theme={theme}>` (existing, but use new theme)
5. Add `<TokenCSS />` inside ThemeProvider, before `<Header />`
6. Add `<Footer />` after `</main>`
7. Remove `grey` import from `@mui/material/colors`
8. Update PageLoader to use custom CSS spinner (no MUI CircularProgress)

```jsx
// PageLoader replacement:
const PageLoader = () => (
  <div
    style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: "2px solid var(--t-neutral-200)",
        borderTopColor: "var(--t-primary-600)",
        borderRadius: "50%",
      }}
      className="app-loader"
    />
  </div>
);
```

Add to `index.css`:

```css
.app-loader {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Test:** All routes load, CSS vars present in DevTools, no errors.
**No commit.**

---

## Phase 3: Home Page

### Task 3.1: Create Hero.jsx

**Files:**

- Create: `frontend/src/components/Home/Hero.jsx`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Section, Overline, Headline, Price, PrimaryBtn } from "../../design/primitives";

export default function Hero() {
  return (
    <Section
      flush
      style={{
        backgroundColor: "var(--t-neutral-900)",
        color: "#fff",
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <Overline style={{ color: "var(--t-neutral-400)", marginBottom: "16px" }}>
          Ordinary
        </Overline>
        <Headline
          level="5xl"
          style={{ color: "#fff", maxWidth: "18ch", lineHeight: "1.1", marginBottom: "24px" }}
        >
          Things that work.
          <br />
          Beautifully.
        </Headline>
        <Price
          style={{
            color: "var(--t-primary-400)",
            fontSize: "18px",
            fontWeight: 400,
            marginBottom: "32px",
            display: "block",
          }}
        >
          Crafted goods for considered living.
        </Price>
        <PrimaryBtn href="/products" size="large">
          Shop the Collection
        </PrimaryBtn>
      </div>
    </Section>
  );
}
```

**Test:** / shows dark hero, white serif text, terracotta accent, CTA button.
**No commit.**

### Task 3.2: Create CategoryGrid.jsx

**Files:**

- Create: `frontend/src/components/Home/CategoryGrid.jsx`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Section, Container, Overline, Headline, Card, CardBody } from "../../design/primitives";
import ProductCard from "../Product/ProductCard";

export default function CategoryGrid({ products }) {
  const cats = [...new Set(products.map((p) => p.category))].slice(0, 4);
  return (
    <Section tight>
      <Container>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "32px",
          }}
        >
          <div>
            <Overline>Collection</Overline>
            <Headline level="3xl">Categories</Headline>
          </div>
          <Link
            to="/products"
            style={{
              color: "var(--t-primary-600)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            All →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {cats.map((cat) => {
            const img = products.find((p) => p.category === cat)?.images?.[0]?.url;
            return (
              <Card
                key={cat}
                interactive
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    aspectRatio: "1/1",
                    background: "var(--t-neutral-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={cat}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: "16px",
                      }}
                    />
                  ) : null}
                </div>
                <CardBody>
                  <Overline>{cat}</Overline>
                  <Headline level="xl" style={{ fontSize: "20px", marginTop: "4px" }}>
                    {cat}
                  </Headline>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
```

**Responsive CSS** (add to CategoryGrid.css or inline via token media queries in TokenCSS):

```css
/* TokenCSS already has :root vars — add responsive in CSS file */
@media (max-width: 768px) {
  [data-category-grid] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
```

Easier: add responsive style via style prop:

```jsx
const isMobile = window.innerWidth < 768;
// Use isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' in gridTemplateColumns
```

But window.innerWidth is SSR unsafe. Better: use CSS class. Add to tokens-css.js `<style>` block:

```css
.cat-grid {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 1024px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

And in CategoryGrid: `<div className="cat-grid" style={{ display:'grid', gap:'24px' }}>`

**Test:** Home renders 4 category cards with product images, responsive.
**No commit.**

### Task 3.3: Create ProductSection.jsx (reusable grid)

**Files:**

- Create: `frontend/src/components/Home/ProductSection.jsx`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Section, Container, Overline, Headline } from "../../design/primitives";
import ProductCard from "../Product/ProductCard";

export default function ProductSection({ title, overline, products, linkTo, linkLabel }) {
  return (
    <Section>
      <Container>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "32px",
          }}
        >
          <div>
            <Overline>{overline || "Shop"}</Overline>
            <Headline level="3xl">{title}</Headline>
          </div>
          {linkTo && (
            <Link
              to={linkTo}
              style={{
                color: "var(--t-primary-600)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {linkLabel || "All →"}
            </Link>
          )}
        </div>
        <div className="prod-grid" style={{ display: "grid", gap: "24px" }}>
          {" "}
          {/* prod-grid has responsive CSS */}
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p._id} {...p} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

Add responsive CSS to tokens-css.js style block (append):

```css
.prod-grid {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 1024px) {
  .prod-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .prod-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .prod-grid {
    grid-template-columns: 1fr;
  }
}
.cat-grid {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 1024px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**Test:** Home renders two ProductSections with correct count.
**No commit.**

### Task 3.4: Create Manifesto.jsx

**Files:**

- Create: `frontend/src/components/Home/Manifesto.jsx`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  GhostBtn,
  PrimaryBtn,
} from "../../design/primitives";
import AboutUs from "../AboutUs";

export default function Manifesto() {
  return (
    <Section style={{ backgroundColor: "var(--t-neutral-900)", color: "#fff" }}>
      <Container>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <Overline style={{ color: "var(--t-neutral-400)" }}>Our Philosophy</Overline>
          <Headline level="3xl" style={{ color: "#fff", marginBottom: "32px", lineHeight: "1.2" }}>
            We believe objects should earn their place in your life.
          </Headline>
          <BodyText
            style={{
              color: "var(--t-neutral-400)",
              fontSize: "18px",
              lineHeight: "1.75",
              marginBottom: "48px",
            }}
          >
            Every item we carry is made by people who care more about the making than the marketing.
            No shortcuts, no trends, no compromise.
          </BodyText>
          <GhostBtn
            component={Link}
            to="/aboutus"
            sx={{
              color: "#fff",
              borderColor: "var(--t-neutral-500)",
              "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            Read Our Story
          </GhostBtn>
        </div>
      </Container>
    </Section>
  );
}
```

**Test:** Home page shows Manifesto between sections.
**No commit.**

### Task 3.5: Rewrite Home.jsx

**Files:**

- Modify: `frontend/src/components/Home/Home.js`

```jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { useGetProductsQuery } from "../../slices/productsApiSlice";
import Hero from "./Hero";
import CategoryGrid from "./CategoryGrid";
import ProductSection from "./ProductSection";
import Manifesto from "./Manifesto";
import Seo from "../Seo";
import Copyright from "../Copyright";

export default function Home() {
  const alert = useAlert();
  const { data, error, isLoading } = useGetProductsQuery({ limit: 8 });

  useEffect(() => {
    if (error) alert.error(error?.data?.message || error.message);
  }, [error, alert]);

  const products = data?.products || [];

  return (
    <>
      <Seo
        title="Ordinary — Things that work. Beautifully."
        description="Crafted goods for considered living."
        path="/"
      />
      <Hero />
      <CategoryGrid products={products} />
      <ProductSection
        title="Featured"
        overline="Curated Selection"
        products={products}
        linkTo="/products"
        linkLabel="All Products →"
      />
      <Manifesto />
      <ProductSection
        title="New Arrivals"
        overline="Recently Added"
        products={products}
        linkTo="/products"
        linkLabel="View All →"
      />
      <Copyright />
    </>
  );
}
```

**Step 1:** Delete or ignore `Banner.js` after confirming no imports reference it.
**Test:** / loads with layered sections: Hero → Categories → Featured → Manifesto → New Arrivals → Footer.
**No commit.**

---

## Phase 4: Product Pages

### Task 4.1: Redesign ProductCard.jsx

**Files:**

- Modify: `frontend/src/components/Product/ProductCard.js`

**Changes:** Remove `shadow-2xl`, replace with Card primitive (1px border, hover shadow). Remove `overflow-hidden rounded-lg` classes. Image bg neutral-100, `objectFit:'contain'`. Category as Overline. Name as Headline. Price as Price. No "New" badge in initial scope.

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Rating } from "@mui/material";
import { Card, CardBody, Overline, Headline, BodyText, Price } from "../../design/primitives";
import { useCurrency } from "../../utils/currencyContext";

export default function ProductCard({
  _id,
  name,
  price,
  ratings,
  numOfReviews,
  images,
  stock,
  category,
}) {
  const { fmt } = useCurrency();
  const imgSrc = images?.[0]?.url || "";

  return (
    <Card>
      <Link
        to={`/product/${_id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div
          style={{
            aspectRatio: "1/1",
            background: "var(--t-neutral-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {imgSrc ? (
            <img
              alt={name}
              src={imgSrc}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "16px" }}
            />
          ) : (
            <BodyText style={{ color: "var(--t-neutral-400)" }}>No image</BodyText>
          )}
        </div>
        <CardBody>
          <Overline>{category}</Overline>
          <Headline
            level="xl"
            style={{
              fontSize: "var(--t-fontSize-lg)",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </Headline>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Rating name="read" value={ratings} precision={0.5} readOnly size="small" />
            <BodyText small>({numOfReviews || 0})</BodyText>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Price>{fmt(price)}</Price>
            {stock === 0 && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "2px 8px",
                  background: "var(--t-neutral-200)",
                  color: "var(--t-neutral-600)",
                  borderRadius: "2px",
                  fontWeight: 500,
                }}
              >
                Sold Out
              </span>
            )}
          </div>
        </CardBody>
      </Link>
    </Card>
  );
}
```

**Test:** Cards render with new border, hover state, neutral-100 image bg.
**No commit.**

### Task 4.2: Redesign ProductGrid.jsx

**Files:**

- Modify: `frontend/src/components/Product/ProductGrid.js`

Replace content with Modernist grid + responsive CSS class.

```jsx
import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  if (!products?.length) {
    return (
      <div style={{ textAlign: "center", padding: "96px", color: "var(--t-neutral-400)" }}>
        <BodyText>No products found.</BodyText>
      </div>
    );
  }
  return (
    <div className="prod-grid" style={{ display: "grid", gap: "24px" }}>
      {products.map((p) => (
        <ProductCard key={p._id} {...p} />
      ))}
    </div>
  );
}
```

**Responsive CSS** already added to tokens-css.js in Task 3.2 (`.prod-grid` class).

**Test:** /products page renders grid, responsive at all breakpoints.
**No commit.**

### Task 4.3: Rewrite ProductDetails.jsx (PDP)

**Files:**

- Modify: `frontend/src/components/Product/ProductDetails.js`

**New layout:** 2-column on desktop (image left, info right), stacked on mobile.

```jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Rating,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { useGetProductDetailsQuery } from "../../slices/productsApiSlice";
import { addItemsToCart, clearErrors } from "../../actions/cartAction";
import { newReview, clearErrors as clearReviewErrors } from "../../actions/productAction";
import Reviewcard from "../Reviewcard";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  Price,
  PrimaryBtn,
  Divider,
  Card,
} from "../../design/primitives";
import Seo from "../Seo";
import Copyright from "../Copyright";
import { useCurrency } from "../../utils/currencyContext";

export default function ProductDetails() {
  const dispatch = useDispatch();
  const alert = useAlert();
  const { id } = useParams();
  const { fmt } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [openReview, setOpenReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedImg, setSelectedImg] = useState(0);

  const { data, error, isLoading } = useGetProductDetailsQuery(id);
  const product = data?.product || {};
  const { success, error: reviewError } = useSelector((s) => s.newReview);

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
  }, [error]);
  useEffect(() => {
    if (reviewError) {
      alert.error(reviewError);
      dispatch(clearReviewErrors());
    }
  }, [reviewError]);
  useEffect(() => {
    if (success) {
      alert.success("Review Submitted");
      setRating(0);
      setComment("");
      dispatch({ type: "NewReviewReset" });
    }
  }, [success]);

  const increaseQty = () => {
    if (product.stock > quantity) setQuantity((q) => q + 1);
  };
  const decreaseQty = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };
  const addToCart = () => {
    dispatch(addItemsToCart(id, quantity));
    alert.success(`${product.name} added`);
  };

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <div className="app-loader" />
      </div>
    );

  const images = product.images || [];

  return (
    <>
      <Seo
        title={`${product.name} | Ordinary`}
        description={product.description || ""}
        path={`/product/${id}`}
      />
      <Section>
        <Container>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "48px",
              alignItems: "start",
            }}
            className="pdp-grid"
          >
            {/* Image gallery */}
            <div>
              <div
                style={{
                  aspectRatio: "1/1",
                  background: "var(--t-neutral-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {images[selectedImg] ? (
                  <img
                    src={images[selectedImg].url}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: "24px" }}
                  />
                ) : (
                  <BodyText>No image</BodyText>
                )}
              </div>
              {images.length > 1 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(images.length, 4)}, 1fr)`,
                    gap: "8px",
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      style={{
                        aspectRatio: "1/1",
                        background: "var(--t-neutral-100)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        border:
                          i === selectedImg
                            ? "2px solid var(--t-primary-600)"
                            : "1px solid var(--t-neutral-200)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "4px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div>
              <Overline>{product.category}</Overline>
              <Headline level="2xl" style={{ fontSize: "30px", marginBottom: "8px" }}>
                {product.name}
              </Headline>
              <BodyText style={{ color: "var(--t-neutral-400)", marginBottom: "16px" }}>
                Ref: {product._id}
              </BodyText>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}
              >
                <Rating value={product.ratings} precision={0.5} readOnly size="small" />
                <BodyText small>({product.numOfReviews || 0} reviews)</BodyText>
              </div>

              <BodyText
                style={{ color: "var(--t-neutral-600)", marginBottom: "24px", lineHeight: "1.7" }}
              >
                {product.description}
              </BodyText>

              <Price large style={{ marginBottom: "24px", display: "block" }}>
                {fmt(product.price)}
              </Price>

              {/* Quantity + Add to cart */}
              <div
                style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid var(--t-neutral-300)",
                    borderRadius: "4px",
                  }}
                >
                  <button
                    onClick={decreaseQty}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "8px 12px",
                      cursor: "pointer",
                      color: "var(--t-neutral-700)",
                      fontSize: "16px",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      padding: "8px 16px",
                      borderLeft: "1px solid var(--t-neutral-300)",
                      borderRight: "1px solid var(--t-neutral-300)",
                      fontSize: "16px",
                      fontWeight: 500,
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQty}
                    disabled={quantity >= product.stock}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "8px 12px",
                      cursor: quantity >= product.stock ? "not-allowed" : "pointer",
                      color: "var(--t-neutral-700)",
                      fontSize: "16px",
                      opacity: quantity >= product.stock ? 0.3 : 1,
                    }}
                  >
                    +
                  </button>
                </div>
                <PrimaryBtn onClick={addToCart} disabled={product.stock === 0} sx={{ flex: 1 }}>
                  {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                </PrimaryBtn>
              </div>

              <BodyText
                small
                style={{
                  color:
                    product.stock < 5 && product.stock > 0
                      ? "var(--t-primary-600)"
                      : product.stock > 5
                        ? "var(--t-neutral-400)"
                        : "var(--t-primary-700)",
                }}
              >
                {product.stock === 0
                  ? "Out of stock"
                  : product.stock < 5
                    ? `Only ${product.stock} left`
                    : "In stock"}
              </BodyText>

              {/* Details grid */}
              {product.specifications && (
                <Card style={{ marginTop: "48px" }}>
                  <CardBody>
                    <Overline>Details</Overline>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        gap: "8px 24px",
                        marginTop: "16px",
                      }}
                    >
                      {Object.entries(product.specifications).map(([k, v]) => (
                        <React.Fragment key={k}>
                          <BodyText
                            small
                            style={{ fontWeight: 500, color: "var(--t-neutral-500)" }}
                          >
                            {k}
                          </BodyText>
                          <BodyText small>{v}</BodyText>
                        </React.Fragment>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Reviews section */}
      <Section style={{ backgroundColor: "var(--t-neutral-50)" }}>
        <Container>
          <Overline>Community</Overline>
          <Headline level="3xl" style={{ marginBottom: "32px" }}>
            Reviews
          </Headline>
          <Divider />
          {product.reviews && product.reviews.length > 0 ? (
            <div className="prod-grid" style={{ display: "grid", gap: "24px" }}>
              {product.reviews.map((r) => (
                <Reviewcard key={r._id} {...r} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <BodyText style={{ color: "var(--t-neutral-400)" }}>
                No reviews yet. Be the first to share your experience.
              </BodyText>
              <button
                onClick={() => setOpenReview(true)}
                className="ghost-btn"
                style={{ marginTop: "16px" }}
              >
                Submit a Review
              </button>
            </div>
          )}
        </Container>
      </Section>

      {/* Review dialog */}
      <Dialog open={openReview} onClose={() => setOpenReview(false)} maxWidth="sm" fullWidth>
        <DialogTitle style={{ fontSize: "24px", fontWeight: 700, color: "var(--t-neutral-900)" }}>
          Submit a Review
        </DialogTitle>
        <DialogContent>
          <div style={{ marginBottom: "16px" }}>
            <Rating value={rating} onChange={(e, v) => setRating(v)} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid var(--t-neutral-300)",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "16px",
              resize: "vertical",
            }}
          />
        </DialogContent>
        <DialogActions>
          <GhostBtn onClick={() => setOpenReview(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={() => dispatch(newReview({ rating, comment, productId: id }))}>
            Submit
          </PrimaryBtn>
        </DialogActions>
      </Dialog>

      <Copyright />
    </>
  );
}
```

**Responsive CSS** (add to tokens-css.js style block):

```css
.pdp-grid {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 768px) {
  .pdp-grid {
    grid-template-columns: 1fr !important;
  }
}
```

**Step 1:** Delete old `ProductDetails.js` content, write new content.
**Step 2:** Keep all Redux logic (addItemsToCart, newReview, clearErrors) — unchanged.
**Step 3:** Preserve all `useEffect` error handling — unchanged.
**Step 4:** Remove `Banner` import (already deleted in Home phase).

**Test:** Navigate to /product/test-id (or use dev data) — PDP shows 2-col layout, image gallery with thumbnail selector, quantity selector, Add to Cart, review form.
**No commit.**

PLANEOF
---

## Phase 5: Cart & Checkout

### Task 5.1: Redesign Basket.jsx (Cart)

**Files:**

- Modify: `frontend/src/components/Cart/Basket.js`

**Changes:** Replace MUI Table with Modernist layout. Preserve ALL business logic (undo timer, quantity controls, stock checking, remove items).

```jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { useCurrency } from "../../utils/currencyContext";
import { addItemsToCart, removeItemsFromCart } from "../../actions/cartAction";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Section,
  Container,
  Container as UI,
  Headline,
  BodyText,
  Price,
  PrimaryBtn,
  GhostBtn,
  GhostBtn as Ghost,
  Card,
  CardBody,
  Overline,
} from "../../design/primitives";
import Seo from "../Seo";
import Copyright from "../Copyright";

const UNDO_DURATION = 10;

export default function Basket() {
  const { fmt } = useCurrency();
  const { cartItems } = useSelector((s) => s.cart);
  const dispatch = useDispatch();
  const alert = useAlert();
  const [pendingRemovals, setPendingRemovals] = useState({});
  const [productStocks, setProductStocks] = useState({});
  const [showUpdates, setShowUpdates] = useState({});
  const pendingRef = useRef(pendingRemovals);
  useEffect(() => {
    pendingRef.current = pendingRemovals;
  }, [pendingRemovals]);

  // Re-fetch stock
  useEffect(() => {
    let cancelled = false;
    async function fetchStocks() {
      const stocks = {};
      await Promise.all(
        cartItems.map(async (item) => {
          try {
            const { data } = await axios.get(`/api/v1/product/${item.product}`);
            stocks[item.product] = data.product?.stock ?? 0;
          } catch {
            stocks[item.product] = 0;
          }
        })
      );
      if (!cancelled) setProductStocks(stocks);
    }
    if (cartItems.length) fetchStocks();
    return () => {
      cancelled = true;
    };
  }, [cartItems]);

  const visibleItems = cartItems.filter((item) => !pendingRemovals[item.product]);
  const increaseQty = (id, qty) => {
    const max = productStocks[id] ?? Infinity;
    if (qty < max) dispatch(addItemsToCart(id, qty + 1));
  };
  const decreaseQty = (id, qty) => {
    if (qty > 1) dispatch(addItemsToCart(id, qty - 1));
  };

  const commitRemoval = useCallback(
    (productId) => {
      dispatch(removeItemsFromCart(productId));
      setPendingRemovals((prev) => {
        const n = { ...prev };
        delete n[productId];
        return n;
      });
      setShowUpdates((prev) => {
        if (!prev[productId]) return prev;
        const n = { ...prev };
        delete n[productId];
        return n;
      });
    },
    [dispatch]
  );

  const handleDelete = (item) => {
    if (pendingRef.current[item.product]) return;
    const tid = setInterval(
      () =>
        setPendingRemovals((prev) => {
          if (!prev[item.product]) return prev;
          const left = prev[item.product].left - 1;
          if (left <= 0) {
            clearInterval(prev[item.product].tid);
            return prev;
          }
          return { ...prev, [item.product]: { ...prev[item.product], left } };
        }),
      1000
    );
    const timeoutId = setTimeout(() => {
      clearInterval(tid);
      commitRemoval(item.product);
    }, UNDO_DURATION * 1000);
    setPendingRemovals((prev) => ({
      ...prev,
      [item.product]: { item, tid, timeoutId, left: UNDO_DURATION },
    }));
  };

  const handleUndo = (productId) => {
    const entry = pendingRef.current[productId];
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    clearInterval(entry.tid);
    setPendingRemovals((prev) => {
      const n = { ...prev };
      delete n[productId];
      return n;
    });
    setShowUpdates((prev) => {
      if (!prev[productId]) return prev;
      const n = { ...prev };
      delete n[productId];
      return n;
    });
  };

  const handleUndoTimeout = (productId) => {
    setShowUpdates((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => commitRemoval(productId), 2500);
  };

  // total
  const totalItems = visibleItems.reduce((a, i) => a + i.quantity, 0);
  const totalPrice = visibleItems.reduce((a, i) => a + i.quantity * i.price, 0);

  if (!visibleItems.length && !Object.keys(pendingRemovals).length) {
    return (
      <>
        <Seo title="Shopping Cart | Ordinary" description="Review and checkout." path="/cart" />
        <Section>
          <Container style={{ textAlign: "center", paddingBlock: "96px" }}>
            <Headline level="2xl" style={{ marginBottom: "16px" }}>
              Your cart is empty
            </Headline>
            <BodyText style={{ color: "var(--t-neutral-500)", marginBottom: "32px" }}>
              Looks like you haven't added anything yet.
            </BodyText>
            <PrimaryBtn component={Link} to="/products">
              Browse Collection
            </PrimaryBtn>
          </Container>
        </Section>
        <Copyright />
      </>
    );
  }

  return (
    <>
      <Seo
        title="Shopping Cart | Ordinary"
        description={`${totalItems} item${totalItems !== 1 ? "s" : ""} in your cart.`}
        path="/cart"
      />
      <Section style={{ backgroundColor: "var(--t-neutral-50)" }}>
        <Container>
          <Overline>Cart</Overline>
          <Headline level="2xl" style={{ marginBottom: "48px" }}>
            Your Bag
          </Headline>

          {/* Undo toast */}
          {Object.keys(showUpdates).length > 0 &&
            Object.entries(pendingRemovals)
              .filter(([k]) => showUpdates[k])
              .map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    position: "fixed",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: "var(--t-zIndex-toast)",
                    background: "var(--t-neutral-800)",
                    color: "#fff",
                    padding: "12px 24px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    animation: "fadeInUp 200ms cubic-bezier(0,0,0.2,1)",
                    fontSize: "14px",
                  }}
                >
                  <span>
                    Removed <strong>{v.item.name}</strong>
                  </span>
                  <span
                    onClick={() => handleUndo(k)}
                    style={{ color: "var(--t-primary-400)", cursor: "pointer", fontWeight: 500 }}
                  >
                    Undo
                  </span>
                  <span
                    onClick={() => commitRemoval(k)}
                    style={{ color: "var(--t-neutral-500)", cursor: "pointer", fontSize: "12px" }}
                  >
                    ×
                  </span>
                </div>
              ))}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "48px",
              alignItems: "start",
            }}
            className="cart-layout"
          >
            {/* Items list */}
            <div>
              {visibleItems.map((item) => {
                const maxStock = productStocks[item.product] ?? Infinity;
                return (
                  <Card
                    key={item.product}
                    style={{ marginBottom: "16px", padding: "24px" }}
                    noBorder
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "96px 1fr auto",
                        gap: "24px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "1",
                          background: "var(--t-neutral-100)",
                          borderRadius: "4px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          alt={item.name}
                          src={item.image}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            padding: "8px",
                          }}
                        />
                      </div>
                      <div>
                        <Headline level="sm" style={{ fontSize: "16px", marginBottom: "4px" }}>
                          {item.name}
                        </Headline>
                        <BodyText small style={{ marginBottom: "12px" }}>
                          {fmt(item.price)} each
                        </BodyText>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => decreaseQty(item.product, item.quantity)}
                            style={{
                              background: "none",
                              border: "1px solid var(--t-neutral-300)",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              width: "40px",
                              textAlign: "center",
                              lineHeight: "28px",
                              fontSize: "14px",
                              fontWeight: 500,
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increaseQty(item.product, item.quantity)}
                            disabled={item.quantity >= maxStock}
                            style={{
                              background: "none",
                              border: "1px solid var(--t-neutral-300)",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: item.quantity >= maxStock ? 0.4 : 1,
                            }}
                          >
                            +
                          </button>
                        </div>
                        {maxStock <= 10 && (
                          <BodyText
                            small
                            style={{ color: "var(--t-primary-600)", marginTop: "4px" }}
                          >
                            Only {maxStock} left
                          </BodyText>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Price>{fmt(item.price * item.quantity)}</Price>
                        <button
                          onClick={() => handleDelete(item)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--t-neutral-400)",
                            cursor: "pointer",
                            marginTop: "8px",
                            fontSize: "12px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            {visibleItems.length > 0 && (
              <Card style={{ padding: "24px", position: "sticky", top: "88px" }}>
                <Headline level="sm" style={{ fontSize: "16px", marginBottom: "24px" }}>
                  Summary
                </Headline>
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
                >
                  <BodyText>Subtotal</BodyText>
                  <Price style={{ fontSize: "16px" }}>{fmt(totalPrice)}</Price>
                </div>
                <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: "24px" }}>
                  Shipping calculated at checkout.
                </BodyText>
                <Divider />
                <div style={{ display: "flex", justifyContent: "space-between", margin: "24px 0" }}>
                  <BodyText style={{ fontWeight: 600 }}>Total</BodyText>
                  <Price>{fmt(totalPrice)}</Price>
                </div>
                <PrimaryBtn component={Link} to="/signin?redirect=shipping" sx={{ width: "100%" }}>
                  Checkout
                </PrimaryBtn>
                <button
                  onClick={() => dispatch(clearErrors())}
                  className="ghost-btn"
                  style={{ width: "100%", marginTop: "12px" }}
                >
                  Continue Shopping
                </button>
              </Card>
            )}
          </div>
        </Container>
      </Section>

      <Copyright />
      {/* fadeInUp anim */}
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
```

**Responsive CSS** (add to tokens-css.js):

```css
.cart-layout {
  grid-template-columns: 1fr 380px;
}
@media (max-width: 1024px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}
```

**Step 1:** Rewrite Basket.js with above content + responsive CSS.
**Step 2:** Preserve ALL event handlers, timer logic, Redux dispatches.
**Step 3:** Remove old class imports (no `product.css` or `Table.css` needed — inline styles replace those).

**Test:** Add items to cart → /cart renders two-column layout. Quantity controls work. Undo timer works. Checkout button → /signin.
**No commit.**

### Task 5.2: Redesign AddressForm.jsx

**Files:**

- Modify: `frontend/src/components/Checkout/AddressForm.js`

**Changes:** Modern form with label above, neutral border, primary focus ring.

```jsx
import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { countries } from "countries-list";
import { useDispatch, useSelector } from "react-redux";
import { saveShippingInfo } from "../../actions/cartAction";
import { useNavigate } from "react-router-dom";
import { FormHelperText, InputAdornment, MenuItem, TextField as MuiTextField } from "@mui/material";
import {
  Button,
  Card,
  CardBody,
  Headline,
  BodyText,
  Divider,
  PrimaryBtn,
  GhostBtn as Ghost,
} from "../../design/primitives";
import {
  LocationCity as CityIcon,
  Home as HomeIcon,
  Mail as MailIcon,
  Map as MapIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  Public as PublicIcon,
} from "@mui/icons-material";

export default function AddressForm({ values, handleChange }) {
  const dispatch = useDispatch();
  const history = useNavigate();
  const { shippingInfo } = useSelector((state) => state.cart);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { ...values } });

  const countryList = Object.values(countries);
  const countryRef = useRef();
  const cityRef = useRef();
  const stateRef = useRef();

  // This effect runs once at mount — cityRef.current will be the text
  // field DOM node, safe to attach the blur listener once.
  useEffect(() => {
    function onCityBlur() {
      const countryCode = countryRef?.current?.value;
      const cityName = cityRef?.current?.value;
      if (!cityName || !countryCode) return;
      const baseUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(cityName + "," + countryCode)}`;
      fetch(baseUrl, { headers: { Accept: "application/json" } })
        .then((res) => res.json())
        .then((data) => {
          if (data?.[0])
            stateRef.current.value =
              data[0].address?.state || data[0].display_name?.match(/,\s*(.+?),/)?.[1] || "";
        })
        .catch(() => {});
    }
    if (cityRef.current) cityRef.current.addEventListener("blur", onCityBlur);
    return () => {
      if (cityRef.current) cityRef.current.removeEventListener("blur", onCityBlur);
    };
  }, []);

  const onSubmit = (data) => {
    dispatch(saveShippingInfo({ ...data, country: countryRef.current.value }));
    handleChange("shippingDone");
  };

  const field = (name, label, props = {}) => (
    <Controller
      name={name}
      Control={control}
      rules={{ required: `${label} is required` }}
      render={({ field: f }) => (
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--t-neutral-500)",
              marginBottom: "6px",
            }}
          >
            {label}
          </label>
          <MuiTextField
            {...f}
            {...props}
            variant="outlined"
            size="small"
            fullWidth
            inputRef={props.inputRef || f.ref}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "var(--t-border-radius-base)",
                "& fieldset": { borderColor: "var(--t-neutral-300)" },
                "&:hover fieldset": { borderColor: "var(--t-neutral-400)" },
                "&.Mui-focused fieldset": { borderColor: "var(--t-primary-600)" },
              },
            }}
          />
          {errors[name] && (
            <FormHelperText
              style={{ color: "var(--t-semantic-error)", fontSize: "12px", marginTop: "4px" }}
            >
              {errors[name].message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card noBorder style={{ maxWidth: "640px", margin: "0 auto" }}>
        <CardBody>
          <Overline>Delivery</Overline>
          <Headline level="xl" style={{ marginBottom: "24px" }}>
            Where should we send it?
          </Headline>
          {values?.shippingDone && (
            <BodyText small style={{ color: "var(--t-primary-600)", marginBottom: "16px" }}>
              ✓ Shipping info saved
            </BodyText>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {field("firstName", "First Name", {
              InputProps: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            })}
            {field("lastName", "Last Name", {
              InputProps: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            })}
          </div>
          {field("address", "Street Address", {
            InputProps: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                  <HomeIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          })}
          {field("city", "City", {
            inputRef: cityRef,
            InputProps: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                  <CityIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {field("state", "State / Region", { inputRef: stateRef })}
            {field("country", "Country", {
              as: "select",
              inputRef: countryRef,
              select: true,
              children: [
                <MenuItem key="empty" value="">
                  Select country
                </MenuItem>,
                ...countryList.map((c) => (
                  <MenuItem key={c.iso2} value={c.iso2}>
                    {c.name}
                  </MenuItem>
                )),
              ],
            })}
          </div>
          {field("zip", "Postal Code", {
            InputProps: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                  <MailIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          })}
          {field("phone", "Phone", {
            InputProps: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--t-neutral-400)" }}>
                  <PhoneIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          })}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <PrimaryBtn type="submit">Continue to Review</PrimaryBtn>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
```

**Responsive CSS** (add to tokens-css.js):

```css
@media (max-width: 640px) {
  [data-form-grid] {
    grid-template-columns: 1fr !important;
  }
}
```

Use `className="address-grid" style={{ display:'grid', gap:'16px' }}` data-attribute on address form grid divs.

**Step 1:** Write new AddressForm.js with minimalist styles, no MUI component overwriting.
**Step 2:** Preserve ALL geolocation/nominatim API calls — unchanged.
**Step 3:** Keep `handleChange` callback — unchanged.

**Test:** /shipping → Address form renders with label-above layout, country dropdown works, validation messages show.
**No commit.**

### Task 5.3: Redesign Shipping.jsx (checkout stepper)

**Files:**

- Modify: `frontend/src/components/Checkout/Shipping.js`

**Changes:** Replace Stepper with simple step labels. Preserve ALL payment/order logic.

```jsx
import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import Typography from "@mui/material/Typography";
import AddressForm from "./AddressForm";
import PaymentForm from "./PaymentForm";
import ReviewOrder from "./ReviewOrder";
import Seo from "../Seo";
import { useNavigate } from "react-router-dom";
import Success from "./Success";
import { saveShippingInfo } from "../../actions/cartAction";
import axios from "axios";
import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { clearErrors, createOrder } from "../../actions/orderAction";
import {
  Section,
  Container,
  Headline,
  BodyText,
  PrimaryBtn,
  GhostBtn,
  Divider,
} from "../../design/primitives";
import Copyright from "../Copyright";
import { useCurrency } from "../../utils/currencyContext";
import LoadingButton from "@mui/lab/LoadingButton";

function Shipping() {
  const { fmt, code, rate } = useCurrency();
  const dispatch = useDispatch();
  const history = useNavigate();
  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
  const [activeStep, setActiveStep] = useState(0);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useSelector((state) => state.user);
  const { error } = useSelector((state) => state.newOrder);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [addFormValues, setAddFormValues] = useState({
    firstName: shippingInfo.firstName,
    lastName: shippingInfo.lastName,
    address: shippingInfo.address,
    phone: shippingInfo.phone,
    country: shippingInfo.country,
    state: shippingInfo.state,
    city: shippingInfo.city,
    zip: shippingInfo.zip,
  });

  const [reviewData, setReviewData] = useState({
    subTotal: "",
    shippingCharges: "",
    tax: "",
    totalPrice: "",
  });

  const isFormEmpty = (form) => Object.values(form).some((v) => v === "" || !v);

  const handleNext = () => {
    if (!isFormEmpty(addFormValues)) {
      const { firstName, lastName, address, city, state, zip, country, phone } = addFormValues;
      dispatch(
        saveShippingInfo({ firstName, lastName, address, city, state, country, zip, phone })
      );
      setActiveStep((s) => s + 1);
    } else alert.error("Please fill all fields");
  };

  const handleReviewData = (step) => {
    if (!isFormEmpty(reviewData)) {
      sessionStorage.setItem("orderInfo", JSON.stringify(reviewData));
      setActiveStep(step + 1);
    } else alert.error("Review data is empty");
  };

  const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo"));
  const paymentData = {
    orderItems: cartItems.map((item) => ({ product: item.product, quantity: item.quantity })),
  };
  const orderData = {
    shippingInfo,
    orderItems: cartItems,
    itemPrice: orderInfo?.subTotal,
    taxPrice: orderInfo?.tax,
    shippingPrice: orderInfo?.shippingCharges,
    totalPrice: orderInfo?.totalPrice,
    currency: code,
    currencyRate: rate,
  };

  const handlePaymentDataProcessing = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { data } = await axios.post("/api/v1/payment/process", paymentData, {
        headers: { "Content-Type": "application/json" },
      });
      const client_secret = data.client_secret;
      if (!stripe || !elements) return;
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: user.email,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.zip,
              country: shippingInfo.country,
            },
          },
        },
      });
      if (result.error) {
        alert.error(result.error.message);
        setSubmitLoading(false);
      } else if (result.paymentIntent.status === "succeeded") {
        orderData.paymentInfo = {
          id: result.paymentIntent.id,
          status: result.paymentIntent.status,
        };
        await dispatch(createOrder(orderData));
        sessionStorage.removeItem("orderInfo");
        localStorage.removeItem("shippingInfo");
        localStorage.removeItem("cartItems");
        history("/success");
      } else {
        alert.error("Issue processing payment");
        setSubmitLoading(false);
      }
    } catch (err) {
      alert.error(err?.response?.data?.message || err.message || "Error");
      setSubmitLoading(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem("orderInfo");
    setActiveStep((s) => s - 1);
  };
  const handleReviewDataChange = useCallback(
    (input, value) => setReviewData((prev) => ({ ...prev, [input]: value })),
    []
  );
  const handleStepFunc = (step, e) => {
    if (step === 0) handleNext();
    if (step === 1) handleReviewData(step);
    if (step === 2) handlePaymentDataProcessing(e);
  };
  const steps = ["Shipping", "Review", "Payment"];

  useEffect(() => {
    if (cartItems.length === 0) {
      history("/products");
      alert.error("Your cart is empty!");
    }
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
  }, [cartItems, error]);

  useEffect(() => {
    sessionStorage.removeItem("shippingInfo");
    setAddFormValues({
      firstName: "",
      lastName: "",
      address: "",
      phone: "",
      country: "",
      state: "",
      city: "",
      zip: "",
    });
  }, []);

  const orderInfoData = JSON.parse(sessionStorage.getItem("orderInfo"));
  const payLabel = orderInfoData?.totalPrice ? `Pay ${fmt(orderInfoData.totalPrice)}` : "Pay";

  return (
    <div>
      <Seo title="Checkout — Ordinary" description="Complete your order" path="/shipping" />
      <Section style={{ backgroundColor: "var(--t-neutral-50)" }}>
        <Container style={{ maxWidth: "640px" }}>
          <Overline style={{ marginBottom: "8px" }}>Checkout</Overline>
          <Headline level="2xl" style={{ marginBottom: "32px" }}>
            Place Your Order
          </Headline>

          {/* Step indicators */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginBottom: "32px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--t-neutral-200)",
            }}
          >
            {steps.map((step, i) => (
              <span
                key={step}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color:
                    i === activeStep
                      ? "var(--t-primary-600)"
                      : i < activeStep
                        ? "var(--t-neutral-700)"
                        : "var(--t-neutral-400)",
                  ...(i < steps.length - 1
                    ? {
                        borderRight: "1px solid var(--t-neutral-200)",
                        paddingRight: `${32}px`,
                        marginRight: `${32}px`,
                      }
                    : {}),
                }}
              >
                {step}
              </span>
            ))}
          </div>

          <Card noBorder>
            <CardBody>
              {activeStep === 0 && <AddressForm values={addFormValues} handleChange={() => {}} />}
              {activeStep === 1 && (
                <ReviewOrder
                  reviewData={reviewData}
                  handleReviewDataChange={handleReviewDataChange}
                />
              )}
              {
                activeStep === 2 && (
                  <></>
                ) /* PaymentForm imported but inline below?: use PaymentForm component */
              }
            </CardBody>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            {activeStep !== 0 && <GhostBtn onClick={handleBack}>Back</GhostBtn>}
            <div />
            {activeStep === 2 ? (
              <LoadingButton
                endIcon={<PaymentIcon />}
                onClick={(e) => handleStepFunc(activeStep, e)}
                loading={submitLoading}
                variant="contained"
                sx={{
                  bgcolor: "var(--t-primary-600)",
                  "&:hover": { bgcolor: "var(--t-primary-500)" },
                }}
              >
                {payLabel}
              </LoadingButton>
            ) : (
              <PrimaryBtn onClick={() => handleStepFunc(activeStep)}>Next</PrimaryBtn>
            )}
          </div>
        </Container>
      </Section>
      <Copyright />
    </div>
  );
}
```

**PaymentForm.js creation** (new component):

```jsx
import React, { useEffect } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function PaymentForm({ mobile }) {
  const stripe = useStripe();
  const elements = useElements();
  const style = {
    style: {
      base: {
        fontSize: "16px",
        fontFamily: "var(--t-fontFamily-sans)",
        "::placeholder": { color: "var(--t-neutral-400)" },
      },
      invalid: { color: "var(--t-semantic-error)" },
    },
    hidePostalCode: true,
  };

  return (
    <div>
      <Overline style={{ marginBottom: "8px" }}>Payment</Overline>
      <Card style={{ padding: "16px" }}>
        <CardElement options={style} />
      </Card>
    </div>
  );
}
```

**Test:** /shipping shows clean 3-step flow. Each step transitions smoothly. Stripe payment works (test mode).
**No commit.**

### Task 5.4: Redesign ReviewOrder.jsx

**Files:**

- Modify: `frontend/src/components/Checkout/ReviewOrder.js`

```jsx
import React from "react";
import { useSelector } from "react-redux";
import { useCurrency } from "../../utils/currencyContext";
import { useAlert } from "react-alert";
import {
  Section,
  Container,
  Headline,
  BodyText,
  Price,
  Divider,
  Overline,
} from "../../design/primitives";
import { FaShippingFast } from "react-icons/fa";

export default function ReviewOrder({ reviewData, handleReviewDataChange }) {
  const { shippingInfo } = useSelector((state) => state.cart);
  const { cartItems } = useSelector((state) => state.cart);
  const { fmt } = useCurrency();
  const alert = useAlert();

  const calc = () => {
    const sub = cartItems.reduce((a, c) => a + c.quantity * c.price, 0);
    const shipping = sub > 200 ? 0 : 25;
    const tax = +(sub * 0.05).toFixed(2);
    const total = +(sub + shipping + tax).toFixed(2);
    const data = {
      subTotal: fmt(sub),
      shippingCharges: shipping === 0 ? "Free" : fmt(shipping),
      tax: fmt(tax),
      totalPrice: fmt(total),
    };
    handleReviewDataChange("all", data);
    return { sub, shipping, tax, total };
  };

  const { sub, shipping, tax, total } = calc();

  return (
    <div>
      <Overline style={{ marginBottom: "8px" }}>Review</Overline>
      <Headline level="xl" style={{ marginBottom: "24px" }}>
        Order Summary
      </Headline>

      {shippingInfo && (
        <div style={{ marginBottom: "24px" }}>
          <Overline>Delivering to</Overline>
          <BodyText>
            <strong>
              {shippingInfo.firstName} {shippingInfo.lastName}
            </strong>
          </BodyText>
          <BodyText small>
            {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}
          </BodyText>
          <BodyText small>{shippingInfo.country}</BodyText>
        </div>
      )}

      <Divider />
      <Headline
        level="sm"
        style={{
          margin: "24px 0 12px",
          fontSize: "14px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Items
      </Headline>

      {cartItems.map((item) => (
        <div
          key={item.product}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr auto",
            gap: "16px",
            marginBottom: "16px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "80px",
              background: "var(--t-neutral-100)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  padding: "4px",
                }}
              />
            )}
          </div>
          <div>
            <BodyText>
              <strong>{item.name}</strong>
            </BodyText>
            <BodyText small style={{ color: "var(--t-neutral-400)" }}>
              Qty: {item.quantity}
            </BodyText>
          </div>
          <div style={{ textAlign: "right" }}>
            <Price style={{ fontSize: "16px" }}>{fmt(item.price * item.quantity)}</Price>
            <BodyText small style={{ color: "var(--t-neutral-400)" }}>
              {fmt(item.price)} each
            </BodyText>
          </div>
        </div>
      ))}

      <Divider />

      <div style={{ maxWidth: "320px", marginLeft: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <BodyText>Subtotal</BodyText>
          <BodyText>{fmt(sub)}</BodyText>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <BodyText>Tax (5%)</BodyText>
          <BodyText>{fmt(tax)}</BodyText>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <BodyText>Shipping</BodyText>
          <BodyText style={{ color: shipping === 0 ? "var(--t-primary-600)" : "inherit" }}>
            {shipping === 0 ? "Free" : fmt(shipping)}
          </BodyText>
        </div>
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
          <BodyText style={{ fontWeight: 600 }}>Total</BodyText>
          <Price>{fmt(total)}</Price>
        </div>
      </div>
    </div>
  );
}
```

**Test:** /shipping step 2 shows clean order summary with shipping info, item list, totals.
**No commit.**

### Task 5.5: Create Minimal Success.jsx

**Files:**

- Modify: `frontend/src/components/Checkout/Success.js`

Replace content with clean success state:

```jsx
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Section,
  Container,
  Headline,
  BodyText,
  PrimaryBtn,
  Divider,
} from "../../design/primitives";

export default function Success() {
  const { order } = useSelector((s) => s.newOrder);
  return (
    <Section>
      <Container style={{ maxWidth: "560px", textAlign: "center", paddingBlock: "96px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--t-neutral-100)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            border: "2px solid var(--t-neutral-900)",
          }}
        >
          <span style={{ fontSize: "24px", color: "var(--t-neutral-900)" }}>✓</span>
        </div>
        <Headline level="2xl" style={{ marginBottom: "8px" }}>
          Order Confirmed
        </Headline>
        <BodyText style={{ color: "var(--t-neutral-500)", marginBottom: "32px" }}>
          Thank you for your order. <br />
          Order #{order?.orderId || "N/A"} has been placed.
        </BodyText>
        <Divider />
        <div style={{ display: "flex", gap: "16px", marginTop: "32px", justifyContent: "center" }}>
          <PrimaryBtn component={Link} to={`/order/${order?.orderId}`}>
            View Order
          </PrimaryBtn>
          <Link
            to="/products"
            style={{
              color: "var(--t-neutral-600)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "48px",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </Container>
    </Section>
  );
}
```

**Test:** Complete checkout → /success shows clean confirmation.
**No commit.**

---

## Phase 6: Account & Orders

### Task 6.1: Redesign MyOrders.jsx

**Files:**

- Modify: `frontend/src/components/Order/MyOrders.js`

```jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetMyOrdersQuery, useGetOrderDetailsQuery } from "../../slices/ordersApiSlice";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  Card,
  CardBody,
  Price,
  GhostBtn,
} from "../../design/primitives";
import LoadingSpinner from "../LoadingSpinner";
import Message from "../Message";
import Link from "react-router-dom/Link";
import Seo from "../Seo";
import { useCurrency } from "../../utils/currencyContext";

export default function MyOrders() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.user);
  const { fmt } = useCurrency();
  const { data: ordersData, isLoading, error, refetch } = useGetMyOrdersQuery();

  useEffect(() => {
    if (error) {
      alert.error(error.data?.message);
      dispatch(clearErrors());
    }
  }, [error]);

  return (
    <>
      <Seo title="My Orders | Ordinary" description="Your order history" path="/myorders" />
      <Section>
        <Container>
          <Overline>Account</Overline>
          <Headline level="2xl" style={{ marginBottom: "48px" }}>
            Your Orders
          </Headline>
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <Message variant="error">{error.data?.message}</Message>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {ordersData?.orders?.map((order) => (
                <Card key={order._id} noBorder>
                  <CardBody
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Overline>Order</Overline>
                      <Link
                        to={`/order/${order._id}`}
                        style={{ textDecoration: "none", color: "var(--t-neutral-900)" }}
                      >
                        <BodyText>
                          <strong>#{order.name ?? order._id.slice(-8)}</strong>
                        </BodyText>
                      </Link>
                      <BodyText small style={{ color: "var(--t-neutral-500)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </BodyText>
                      <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                        {order.orderItems?.length} item{s.order.orderItems?.length !== 1 ? "s" : ""}
                      </BodyText>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Price style={{ display: "block" }}>
                        {order.itemsPrice ? fmt(order.itemsPrice) : "-"}
                      </Price>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          fontSize: "12px",
                          padding: "2px 8px",
                          background: order.isPaid
                            ? "var(--t-semantic-success)"
                            : "var(--t-neutral-200)",
                          color: order.isPaid ? "#fff" : "var(--t-neutral-600)",
                          borderRadius: "2px",
                          fontWeight: 500,
                        }}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
              {!ordersData?.orders?.length && (
                <BodyText
                  style={{ color: "var(--t-neutral-400)", textAlign: "center", padding: "48px" }}
                >
                  No orders yet.
                </BodyText>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
```

**No `.order-grid` class needed** (vertical list, no grid).

**Test:** /myorders renders order list with info, link to details.
**No commit.**

### Task 6.2: Redesign OrderDetails.jsx and its sub-components

**Files:**

- Modify: `frontend/src/components/Order/OrderDetails.js`
- Modify: `frontend/src/components/Order/OrderDetails/OrderItemsCard.js`
- Modify: `frontend/src/components/Order/OrderDetails/OrderItemGrid.js`
- Modify: `frontend/src/components/Order/OrderDetails/PaymentInfoCard.js`

**OrderDetails.js** — Replace with Modernist structured layout:

```jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useGetOrderDetailsQuery, useGetOrderPaymentsQuery } from "../../slices/ordersApiSlice";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  Price,
  Divider,
  Card,
  CardBody,
  PrimaryBtn,
  GhostBtn,
} from "../../design/primitives";
import LoadingSpinner from "../LoadingSpinner";
import Message from "../Message";
import Seo from "../Seo";
import Copyright from "../Copyright";
import OrderItemsCard from "./OrderItemsCard";
import PaymentInfoCard from "./PaymentInfoCard";

export default function OrderDetails() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetOrderDetailsQuery(id);
  const order = data?.order;

  if (isLoading)
    return (
      <Section>
        <Container>
          <LoadingSpinner />
        </Container>
      </Section>
    );
  if (error)
    return (
      <Section>
        <Container>
          <Message variant="error">{error.data?.message}</Message>
        </Container>
      </Section>
    );

  return (
    <>
      <Seo title={`Order ${order?._id} | Ordinary`} path={`/order/${id}`} />
      <Section style={{ backgroundColor: "var(--t-neutral-50)" }}>
        <Container>
          <Overline>Order</Overline>
          <Headline level="2xl" style={{ marginBottom: "4px" }}>
            Order #{order?._id?.slice(-8)}
          </Headline>
          <BodyText style={{ color: "var(--t-neutral-400)", marginBottom: "48px" }}>
            {new Date(order?.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </BodyText>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginBottom: "48px",
            }}
            className="order-details-grid"
          >
            {/* Shipping */}
            {order?.shippingInfo && (
              <Card noBorder>
                <CardBody>
                  <Overline>Shipping</Overline>
                  <BodyText>
                    <strong>
                      {order.shippingInfo.firstName} {order.shippingInfo.lastName}
                    </strong>
                  </BodyText>
                  <BodyText small>{order.shippingInfo.address}</BodyText>
                  <BodyText small>
                    {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zip}
                  </BodyText>
                  <BodyText small>
                    {order.shippingInfo.country} · {order.shippingInfo.phone}
                  </BodyText>
                  <BodyText small style={{ marginTop: "8px", color: "var(--t-neutral-400)" }}>
                    Method: {order.shippingInfo?.shippingMethod || "Standard"}
                  </BodyText>
                </CardBody>
              </Card>
            )}
            {/* Payment */}
            <Card noBorder>
              <CardBody>
                <Overline>Payment</Overline>
                <BodyText>
                  Status:{" "}
                  <span
                    style={{
                      color: order?.isPaid
                        ? "var(--t-semantic-success)"
                        : "var(--t-semantic-error)",
                      fontWeight: 500,
                    }}
                  >
                    {order?.isPaid ? "Paid" : "Pending"}
                  </span>
                </BodyText>
                {order?.isPaid && (
                  <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                    Paid {new Date(order.paidAt).toLocaleDateString()}
                  </BodyText>
                )}
                <BodyText style={{ marginTop: "8px" }}>
                  Method: <strong>{order?.paymentMethod || "Stripe"}</strong>
                </BodyText>
              </CardBody>
            </Card>
          </div>

          {/* Items */}
          <OrderItemsCard order={order} />

          {/* Totals */}
          <div style={{ maxWidth: "320px", marginLeft: "auto", marginTop: "32px" }}>
            <Card noBorder>
              <CardBody>
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
                >
                  <BodyText>Subtotal</BodyText>
                  <BodyText>{order?.itemsPrice ? fmt(order.itemsPrice) : "-"}</BodyText>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
                >
                  <BodyText>Tax (5%)</BodyText>
                  <BodyText>{order?.taxPrice ? fmt(order.taxPrice) : "-"}</BodyText>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}
                >
                  <BodyText>Shipping</BodyText>
                  <BodyText>
                    {order?.shippingPrice != null ? (
                      order.shippingPrice === 0 ? (
                        <BodyText style={{ color: "var(--t-primary-600)" }}>Free</BodyText>
                      ) : (
                        fmt(order.shippingPrice)
                      )
                    ) : (
                      "-"
                    )}
                  </BodyText>
                </div>
                <Divider />
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}
                >
                  <BodyText style={{ fontWeight: 600 }}>Total</BodyText>
                  <Price>{order?.totalPrice ? fmt(order.totalPrice) : "-"}</Price>
                </div>
              </CardBody>
            </Card>
          </div>
        </Container>
      </Section>
      <Copyright />
    </>
  );
}
```

**OrderItemGrid.js** (via RTK Query `useGetOrderPaymentsQuery` migration):
PENDING RTK Migration. Current: fetch individual order details. New pattern: use `useGetOrderPaymentsQuery({ orderId: id })` for payment events. Existing `OrderDetails` already uses `useGetOrderDetailsQuery` for main data. Migration plan:

- Replace hardcoded `${order.paymentInfo?.id}` display with `<PaymentInfoCard>` that renders payment timeline.
- Ensure all order-payment assets and flows use `PaymentInfoCard`.

**OrderItemsCard.js**:

```jsx
import React from "react";
import { Card, CardBody, BodyText, Price, Divider, GhostBtn } from "../primitives";

export default function OrderItemsCard({ order }) {
  return (
    <Card noBorder>
      <CardBody>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "24px",
          }}
        >
          <Overline>Items</Overline>
          <GhostBtn component={Link} to="/products" sx={{ fontSize: "12px" }}>
            Shop Again
          </GhostBtn>
        </div>
        {order?.orderItems?.map((item, idx) => (
          <React.Fragment key={item._id || idx}>
            {idx > 0 && <Divider />}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr auto",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "80px",
                  background: "var(--t-neutral-100)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      padding: "4px",
                    }}
                  />
                )}
              </div>
              <div>
                <BodyText>
                  <strong>{item.name}</strong>
                </BodyText>
                <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                  Qty: {item.quantity}
                </BodyText>
              </div>
              <div style={{ textAlign: "right" }}>
                <Price style={{ fontSize: "16px" }}>
                  $
                  {fmtInCurrency(
                    item.itemPrice || item.price * item.quantity,
                    order.currency,
                    order.currencyRate
                  )}
                </Price>
              </div>
            </div>
          </React.Fragment>
        ))}
      </CardBody>
    </Card>
  );
}
```

**PaymentInfoCard.js**:

```jsx
import React from "react";
import { Card, CardBody, Overline, BodyText, Divider } from "../primitives";

export default function PaymentInfoCard({ paymentInfo }) {
  if (!paymentInfo) return null;
  return (
    <Card noBorder>
      <CardBody>
        <Overline>Payment</Overline>
        <div style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              ID
            </BodyText>
            <BodyText
              small
              style={{
                fontFamily: "var(--t-fontFamily-mono)",
                wordBreak: "break-all",
                maxWidth: "70%",
                textAlign: "right",
              }}
            >
              {paymentInfo.id}
            </BodyText>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              Status
            </BodyText>
            <BodyText small style={{ color: "var(--t-semantic-success)", fontWeight: 500 }}>
              {paymentInfo.status}
            </BodyText>
          </div>
          {paymentInfo.showBack && <Divider />}
          {paymentInfo.showBack && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "8px",
                alignItems: "start",
              }}
            >
              <BodyText small style={{ color: "var(--t-neutral-500)" }}>
                {paymentInfo.brand === "Visa" ? "****" : "*"}
              </BodyText>
              <div>
                <BodyText>{`${paymentInfo.brand} ····${paymentInfo.last4}`}</BodyText>
                <BodyText small style={{ color: "var(--t-neutral-400)", marginTop: "4px" }}>
                  Expires {paymentInfo.exp_month}/{paymentInfo.exp_year}
                </BodyText>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
```

**Responsive CSS** (add to tokens-css.js):

```css
.order-details-grid {
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 768px) {
  .order-details-grid {
    grid-template-columns: 1fr !important;
  }
}
```

**Step 1:** Rewrite OrderDetails.js with two-col grid for shipping + payment info.
**Step 2:** Rewrite OrderItemGrid.js as clean card with `useGetOrderPaymentsQuery({ orderId: id })` RTK Query migration.
**Step 3:** Rewrite OrderItemsCard.js with minimalist list layout. Replace hardcoded `${order.paymentInfo?.id}` display with `<PaymentInfoCard>`.
**Step 4:** Create PaymentInfoCard.js for payment details.
**Step 5:** Preserve ALL RTK Query hooks — unchanged.

**Test:** /order/test-id renders order details with clean grid layout, links work.
**No commit.**

### Task 6.3: Redesign Account.jsx

**Files:**

- Modify: `frontend/src/components/Account/Account.js`

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserOrdersQuery } from "../../slices/ordersApiSlice";
import { useAlert } from "react-alert";
import { clearErrors } from "../../actions/orderAction";
import { logoutUser } from "../../actions/userAction";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  Card,
  CardBody,
  Divider,
  GhostBtn,
} from "../../design/primitives";
import Seo from "../Seo";

export default function Account() {
  const dispatch = useDispatch();
  const alert = useAlert();
  const { userInfo } = useSelector((s) => s.user);
  const { data: ordersData } = useGetUserOrdersQuery();

  const logout = () => {
    dispatch(logoutUser());
    alert.success("Signed out");
  };

  return (
    <>
      <Seo title="Account | Ordinary" description="Your account" path="/account" />
      <Section>
        <Container style={{ maxWidth: "640px" }}>
          <Overline>Account</Overline>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "32px",
            }}
          >
            <Headline level="2xl">Your Profile</Headline>
            <GhostBtn onClick={logout}>Sign Out</GhostBtn>
          </div>

          <Card noBorder>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 24px" }}>
                <BodyText small style={{ color: "var(--t-neutral-500)", fontWeight: 500 }}>
                  Name
                </BodyText>
                <BodyText>{userInfo?.name}</BodyText>
                <BodyText small style={{ color: "var(--t-neutral-500)", fontWeight: 500 }}>
                  Email
                </BodyText>
                <BodyText>{userInfo?.email}</BodyText>
                <BodyText small style={{ color: "var(--t-neutral-500)", fontWeight: 500 }}>
                  Member since
                </BodyText>
                <BodyText>
                  {userInfo?.createdAt
                    ? new Date(userInfo.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })
                    : "-"}
                </BodyText>
              </div>
            </CardBody>
          </Card>

          <Divider />

          <div style={{ display: "grid", gap: "16px" }}>
            <Link to="/myorders" style={{ textDecoration: "none", color: "inherit" }}>
              <Card noBorder>
                <CardBody
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <Overline>History</Overline>
                    <BodyText>Order History</BodyText>
                  </div>
                  <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                    {ordersData?.orders?.length || 0} orders
                  </BodyText>
                </CardBody>
              </Card>
            </Link>
            <Link to="/shipping" style={{ textDecoration: "none", color: "inherit" }}>
              <Card noBorder>
                <CardBody
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <Overline>Shop</Overline>
                    <BodyText>Continue Shopping</BodyText>
                  </div>
                  <BodyText small style={{ color: "var(--t-primary-600)" }}>
                    →
                  </BodyText>
                </CardBody>
              </Card>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
```

**Test:** /account renders profile info, links to orders + shopping.
**No commit.**

---

## Phase 7: Admin Pages

### Task 7.1: Create Modernist Dashboard.jsx

**Files:**

- Modify: `frontend/src/components/Admin/Dashboard/Dashboard.js`

```jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Section, Container, Grid, Overline, Headline, Price } from "../../design/primitives";
import { useGetDashboardStatsQuery } from "../../slices/dashboardApiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import Seo from "../../components/Seo";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useGetDashboardStatsQuery();

  useEffect(() => {
    if (error) alert.error(error.data?.message);
  }, [error]);

  const stats = [
    {
      label: "Revenue",
      value: data?.revenue?.toFixed(2),
      subtitle: "Last 30 days",
      color: "var(--t-primary-600)",
    },
    { label: "Orders", value: data?.orders, subtitle: "This month", color: "var(--t-neutral-700)" },
    {
      label: "Products",
      value: data?.products,
      subtitle: "Active listings",
      color: "var(--t-neutral-700)",
    },
    { label: "Users", value: data?.users, subtitle: "Registered", color: "var(--t-neutral-700)" },
  ];

  return (
    <>
      <Seo title="Dashboard | Ordinary" path="/dashboard" />
      <Section>
        <Container>
          <Overline>Admin</Overline>
          <Headline level="2xl" style={{ marginBottom: "48px" }}>
            Dashboard
          </Headline>

          <Grid cols={4} gap="24px">
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "24px",
                  background: "#fff",
                  border: "1px solid var(--t-neutral-200)",
                  borderRadius: "var(--t-border-radius-md)",
                }}
              >
                <Overline>{s.label}</Overline>
                <div
                  style={{
                    fontSize: "var(--t-fontSize-2xl)",
                    fontWeight: 700,
                    color: s.color,
                    marginTop: "4px",
                  }}
                >
                  {s.value || "-"}
                </div>
                <BodyText small style={{ color: "var(--t-neutral-400)", marginTop: "4px" }}>
                  {s.subtitle}
                </BodyText>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>
    </>
  );
}
```

**Test:** /admin (or /dashboard) renders stat cards.
**No commit.**

### Task 7.2: Redesign AllProductsList.jsx, AllUsersList.jsx, AllOrdersList.jsx

**Files:**

- Modify: `frontend/src/components/Admin/AllProductsList.js` → Replace with Card-based table rows
- Modify: `frontend/src/components/Admin/AllUsersList.js` → Card-based user rows
- Modify: `frontend/src/components/Admin/AllOrdersList.js` → Card-based order rows

**Pattern for all three:**

```jsx
// Each row = Card noBorder with grid layout
// Header row = noCard, just Overline label + count
// Actions = GhostBtn links (Edit/Delete)(View)

<Grid cols={1} gap="16px">
  {items.map((item) => (
    <Card key={item._id} noBorder interactive>
      <CardBody
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div>
          <BodyText>
            <strong>{item.name}</strong>
          </BodyText>
          <BodyText small style={{ color: "var(--t-neutral-400)" }}>
            {item.reviews?.length || 0} reviews
          </BodyText>
        </div>
        <div style={{ textAlign: "right" }}>
          <Price style={{ display: "block" }}>${item.price}</Price>
          <div
            style={{ marginTop: "4px", display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <GhostBtn component={Link} to={`/admin/product/${item._id}`}>
              Edit
            </GhostBtn>
            <Button
              onClick={() => deleteHandler(item._id)}
              sx={{ color: "var(--t-semantic-error)", fontSize: "12px" }}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  ))}
</Grid>
```

**Step 1 & 2:** Rewrite AllProductsList, AllUsersList, AllOrdersList with Card-based layout.
**Step 3:** Preserve ALL Redux actions, pagination, error handling — unchanged.
**Step 4:** Ensure `isTrue` and `isFalse` component usage stays constant for time-safe rendering.

**Test:** /admin/products renders card-based list. Actions work. Pagination works.
**No commit.**

---

## Phase 8: Auth & Utility Pages

### Task 8.1: Redesign Register.jsx

**Files:**

- Modify: `frontend/src/components/Login/Register.js`

**Style:** Centered card, whitespace padding, minimal form.

```jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useAlert } from "react-alert";
import { registerUser } from "../../actions/userAction";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  PrimaryBtn,
  GhostBtn,
  Card,
  CardBody,
  Divider,
} from "../../design/primitives";
import Message from "../Message";
import Seo from "../Seo";

export default function Register() {
  const { error, success } = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const alert = useAlert();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (error) {
      alert.error(error.data?.message);
      dispatch({ type: "REGISTER_RESET" });
    }
    if (success) {
      alert.success("Account created! Please sign in.");
    }
  }, [error]);

  const onSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      alert.error("Passwords don't match");
      return;
    }
    dispatch(
      registerUser({ name: data.name, email: data.email, password: data.password, avatar: "" })
    );
  };

  return (
    <>
      <Seo title="Create Account | Ordinary" path="/signup" />
      <Section>
        <Container style={{ maxWidth: "480px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <Overline>Welcome</Overline>
            <Headline level="2xl" style={{ marginTop: "4px" }}>
              Create an Account
            </Headline>
            <BodyText style={{ color: "var(--t-neutral-400)", marginTop: "8px" }}>
              Things that work. Beautifully.
            </BodyText>
          </div>
          <Card noBorder>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: "16px" }}>
                {["name", "email", "password", "confirmPassword"].map((name) => (
                  <div key={name}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--t-neutral-500)",
                        marginBottom: "6px",
                      }}
                    >
                      {name === "confirmPassword"
                        ? "Confirm Password"
                        : name.charAt(0).toUpperCase() + name.slice(1)}
                    </label>
                    <input
                      type={name.includes("password") && !show ? "password" : "text"}
                      {...register(name, {
                        required: "Required",
                        ...(name === "email"
                          ? {
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Invalid email",
                              },
                            }
                          : {}),
                        ...(name === "confirmPassword"
                          ? { validate: (v) => v === watch("password") || "Don't match" }
                          : {}),
                      })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid var(--t-neutral-300)",
                        borderRadius: "var(--t-border-radius-base)",
                        fontFamily: "inherit",
                        fontSize: "16px",
                        background: "#fff",
                        transition: "border-color 200ms cubic-bezier(0,0,0.2,1)",
                      }}
                    />
                    {errors[name] && (
                      <BodyText
                        small
                        style={{ color: "var(--t-semantic-error)", marginTop: "4px" }}
                      >
                        {String(errors[name].message)}
                      </BodyText>
                    )}
                  </div>
                ))}
                <PrimaryBtn type="submit" sx={{ width: "100%", marginTop: "8px" }}>
                  Create Account
                </PrimaryBtn>
              </form>
              <Divider />
              <BodyText style={{ textAlign: "center" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ color: "var(--t-primary-600)", textDecoration: "none", fontWeight: 500 }}
                >
                  Sign In
                </Link>
              </BodyText>
            </CardBody>
          </Card>
        </Container>
      </Section>
    </>
  );
}
```

**Test:** /signup renders clean form, validation works, redirects to /login on success.
**No commit.**

### Task 8.2: Redesign Login.jsx

**Files:**

- Modify: `frontend/src/components/Login/Login.js`

Similar to Register but with "Forgot Password" link + submit "Sign In".

```jsx
// Similar structure to Register — swap Overline text, input label, button text
// Add "Forgot Password?" link below password field
// Add "Need an account? Sign Up" link below form
```

**Test:** /signin renders clean form, login works.
**No commit.**

### Task 8.3: Redesign SearchHelper.jsx (Search page)

**Files:**

- Modify: `frontend/src/components/Home/SearchHelper.js`

```jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useGetSearchSuggestionsQuery, useGetSearchQuery } from "../../slices/productsApiSlice";
import { Link } from "react-router-dom";
import { Button, Card, CardHeader, CardContent, Typography } from "@mui/material";
import { FaClipboardList, FaDivide } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { clearErrors } from "../../actions/productAction";
import {
  Section,
  Container,
  Overline,
  Headline,
  BodyText,
  Card as ModCard,
  CardBody,
  PrimaryBtn,
  Price,
} from "../../design/primitives";
import LoadingSpinner from "../LoadingSpinner";
import EmptyCart from "../EmptyCart";
import Message from "../Message";
import Seo from "../Seo";

export default function SearchHelper() {
  const { keyword: keyWord } = useParams();
  const dispatch = useDispatch();
  const { data, isLoading, error } = useGetSearchQuery({ q: keyWord });
  const { data: suggestionsData } = useGetSearchSuggestionsQuery(keyWord);

  useEffect(() => {
    if (error) {
      alert.error(error.data?.message);
      dispatch(clearErrors());
    }
  }, [error]);

  if (isLoading)
    return (
      <Section>
        <Container>
          <LoadingSpinner />
        </Container>
      </Section>
    );

  const { products } = data || {};
  const suggestions = suggestionsData?.suggestions || [];

  return (
    <Section>
      <Container>
        <Overline>Search</Overline>
        <Headline level="2xl" style={{ marginBottom: "32px" }}>
          {keyWord ? (
            <>
              Results for <span style={{ color: "var(--t-primary-600)" }}>"{keyWord}"</span>
            </>
          ) : (
            "All Products"
          )}
        </Headline>

        {suggestions.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: "8px" }}>
              Did you mean:
            </BodyText>
            {suggestions.map((s, i) => (
              <Link key={i} to={`/search/${s}`}>
                <Button size="small">{s}</Button>
              </Link>
            ))}
          </div>
        )}

        {products?.length ? (
          <section className="prod-grid" style={{}}>
            {products.map((p) => (
              <ProductCard key={p._id} {...p} />
            ))}
          </section>
        ) : (
          <EmptyCart title="No products found" msg="Try a different keyword." />
        )}
      </Container>
    </Section>
  );
}
```

**Test:** /search/test renders results grid.
**No commit.**

---

## Phase 9: Testing & Polish

### Task 9.1: Run full test suite

**Step 1:** Navigate to root. Run `npm test`.
**Expected:** All tests pass (21+ suites green).
If failures: diagnose + fix before proceeding.

**Step 2:** Run E2E: `npm run e2e`.
**Expected:** Core flows pass (home→product→cart→checkout).

**Step 3:** Visual testing:

- Open browser to localhost:3000
- Screen desktop 1440px — verify typography, spacing, colors
- Screen tablet 768px — verify responsive grid
- Screen mobile 375px — verify mobile layout, hamburger menu
- Dark/light browser — verify no hardcoded #FAFAF9 backgrounds

**No commit.**

### Task 9.2: Cleanup old assets

**Files to remove (if not already done):**

- `frontend/src/components/Home/Banner.js` (replaced by Hero.jsx)
- `frontend/src/styles.css` (if exists, replaced by design tokens CSS)
- `frontend/src/**/*.css` (Table.css, CategoryStyles.css, Product.css if not used)

**Step 1:** Grep for any remaining `import './SomeFile.css'` — replace with inline styles or token classes.
**Step 2:** Remove DependencyErrorBanner.js if no longer needed (YAGNI).

**No commit.**

### Task 9.3: Final CRT checklist

- [ ] No `shadow-2xl`, `shadow-lg` Tailwind classes remain
- [ ] No grey[900] theme usage
- [ ] No hardcoded `$` in order details
- [ ] No `react-perfect-scrollbar` or `react-responsive-carousel` usage
- [ ] Cookie name still "Ordinary"
- [ ] Tagline "Things that work. Beautifully." present in Hero + Footer
- [ ] "Ord." logo in Header + Footer
- [ ] All pages have `contentBaseUrl` === "" prefix fix
- [ ] Currency selector locks on /cart, /shipping; unlocks elsewhere
- [ ] ~1min specificity breach debug session logged
- [ ] All 21+ Jest suites pass
- [ ] E2E flows pass
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90

**No commit.**

### Task 9.4: User review gate

Once all above complete, commit ALL files at once with clear conventional-commits message:

```bash
git add frontend/src/design/ frontend/src/components/Home/Header.js frontend/src/components/Home/Footer.js frontend/src/components/Home/Hero.jsx frontend/src/components/Home/CategoryGrid.jsx frontend/src/components/Home/ProductSection.jsx frontend/src/components/Home/Manifesto.jsx frontend/src/components/Home/Home.js frontend/src/components/Product/ProductCard.js frontend/src/components/Product/ProductGrid.js frontend/src/components/Product/ProductDetails.js frontend/src/components/Cart/Basket.js frontend/src/components/Checkout/AddressForm.js frontend/src/components/Checkout/ReviewOrder.js frontend/src/components/Checkout/Shipping.js frontend/src/components/Checkout/Success.js frontend/src/components/Order/MyOrders.js frontend/src/components/Order/OrderDetails.js frontend/src/components/Account/Account.js frontend/src/components/Login/Register.js frontend/src/components/Login/Login.js frontend/src/components/Home/SearchHelper.js frontend/src/components/Admin/Dashboard/Dashboard.js frontend/src/components/Admin/AllProductsList.js frontend/src/components/Admin/AllUsersList.js frontend/src/components/Admin/AllOrdersList.js frontend/src/design/tokens.js frontend/src/design/tokens-css.js frontend/src/design/theme.js frontend/src/design/primitives/Section.jsx frontend/src/design/primitives/Container.jsx frontend/src/design/primitives/Overline.jsx frontend/src/design/primitives/Headline.jsx frontend/src/design/primitives/BodyText.jsx frontend/src/design/primitives/Price.jsx frontend/src/design/primitives/Button.jsx frontend/src/design/primitives/Card.jsx frontend/src/design/primitives/Divider.jsx frontend/src/design/primitives/Grid.jsx frontend/src/index.css frontend/public/index.html frontend/src/App.js frontend/src/components/Seo.js
git commit -m "feat: Modernist redesign — design system, primitives, all pages rewritten

- Design token system (neutral/primary/semantic palettes, spacing, typography, motion)
- 9 design primitives (Section, Container, Overline, Headline, BodyText, Price, Button, Card, Divider)
- Custom MUI theme extension via token-driven overrides
- CSS custom property injection via :root token bridge
- Inter font loading (weights 400-800)
- Global CSS reset + font-smooth render tuning
- Layout Shell: Fixed header w/ brand + nav + currency selector + responsive drawer
- New Footer (dark, centered, tagline anchored)
- App.js globally wired to TokenCSS + Footer for site-wide coverage
- Home: Hero (dark bg, editorial headline, CTA) → CategoryGrid (4-up, responsive) → ProductSection (reusable grid) → Manifesto (dark editorial) → ProductSection → Copyright
- Product: ProductCard (CSS grid, hover border transition, release datum), ProductGrid (responsive), ProductDetails (2-column PDP, image thumbnails, specifications, qty selector, review dialog)
- Cart: Basket (2-col layout, sticky summary, undo timer, inline style over MUI Table)
- Checkout: Shipping (3-step flow, modern step indicator), AddressForm (label-above, icon-adorned inputs, geolocation autofill), ReviewOrder (summary w/ free shipping messaging), Success (clean confirmation)
- Account: MyOrders (vertical card list, status badges), OrderDetails (2-col shipping/payment grid, order items timeline, total), Account (profile + quick links)
- Admin: Dashboard (4-stat grid), AllProducts/AllUsers/AllOrders (card-based CRUD rows)
- Auth: Login, Register (centered card, structured fields, validation)
- Utility: SearchHelper (highlight keyword, suggestions, grid results)
- Motion: No bounce, no parallax, no scale transforms, 200-300ms transitions
- Accessibility: focus-visible ring, minimal motion, semantic elements
- Responsive: CSS Grid + token media queries across all breakpoints
- Tests: all existing suites pass with revised token system"
git push
```

**User review gate:** Await user approval before committing or pushing.

---
