# Account Page Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the `/account` page so the avatar sidebar is narrow (280px) and the profile form fills the remaining space on desktop, stacking cleanly on tablet and mobile.

**Architecture:** CSS-only edit to one rule in `tokens-css.js`. The avatar card content is short; the form is taller. `align-items: start` prevents the sidebar from stretching. Tablet caps avatar width to 360px so it doesn't span the full width awkwardly.

**Tech Stack:** Plain CSS via CSS custom properties; existing `--t-grid-gutter` token.

## Global Constraints

- Touch only `frontend/src/design/tokens-css.js`. No component code changes.
- Reuse `--t-grid-gutter` (do not hardcode gap values).
- Keep the existing 1024px / 768px / 480px breakpoint ladder consistent with neighbours (`.cart-layout`, `.checkout-grid`, `.filter-grid`).
- Manual visual verification required at desktop (1440 / 1024) and mobile (390 / 768).
- No Jest or Playwright updates (no behavioural change).
- Commit messages follow repo's `type(scope): summary` style with Co-Authored-By line.

---

## File Structure

| File                                         | Change                                |
|----------------------------------------------|---------------------------------------|
| `frontend/src/design/tokens-css.js`          | Replace `.account-grid` rule + add 2 selectors in the 1024px breakpoint block |

No new files. No component edits.

---

### Task 1: Rebalance account grid

**Files:**
- Modify: `frontend/src/design/tokens-css.js:106-110` (replace `.account-grid` rule)
- Modify: `frontend/src/design/tokens-css.js:122-127` (extend the existing 1024px breakpoint block)

**Interfaces:**
- Consumes: `--t-grid-gutter` design token (already defined in same file)
- Produces: `.account-grid` renders as `280px 1fr` on desktop, stacks with avatar cap on tablet/mobile

- [ ] **Step 1: Replace the `.account-grid` rule**

In `frontend/src/design/tokens-css.js`, find:

```css
    .account-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--t-grid-gutter);
    }
```

Replace with:

```css
    .account-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--t-grid-gutter);
      align-items: start;
    }
```

- [ ] **Step 2: Extend the 1024px breakpoint block**

Find:

```css
    @media (max-width: 1024px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(3, 1fr); }
      .cart-layout, .checkout-grid, .account-grid, .filter-grid {
        grid-template-columns: 1fr;
      }
    }
```

Replace with:

```css
    @media (max-width: 1024px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(3, 1fr); }
      .cart-layout, .checkout-grid, .account-grid, .filter-grid {
        grid-template-columns: 1fr;
      }
      .account-grid > :first-child { max-width: 360px; }
    }
```

- [ ] **Step 3: Update the 768px breakpoint block**

Find:

```css
    @media (max-width: 768px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .pdp-grid, .order-details-grid { grid-template-columns: 1fr !important; }
      .filter-grid { grid-template-columns: 1fr; }
    }
```

Replace with:

```css
    @media (max-width: 768px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .pdp-grid, .order-details-grid { grid-template-columns: 1fr !important; }
      .filter-grid { grid-template-columns: 1fr; }
      .account-grid > :first-child { max-width: 100%; }
    }
```

- [ ] **Step 4: Visually verify**

Run: `npm start --prefix frontend` then load `/account` (must be logged in). Use DevTools responsive mode to test three widths:

- 1440px desktop → avatar column 280px, form fills remainder
- 1024px boundary → stacks, avatar card no wider than 360px
- 390px mobile → full-width stacked card

Expected: avatar sidebar reads as compact at all widths; form has comfortable room for fields and button row.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/design/tokens-css.js
git commit -m "fix(account): rebalance grid — narrow avatar sidebar, wide form

Flip .account-grid from '1fr 380px' to '280px 1fr' so the avatar
card sits compact while the profile form gets the remaining space.
align-items: start prevents the sidebar from stretching to match
the taller form. Tablet (<=1024px) caps the stacked avatar card
to 360px so it does not span awkwardly; mobile lifts the cap.

Co-Authored-By: Claude <noreply@anthropic.com>"
```
