# Account Page Layout — Design Spec

**Date:** 2026-07-15
**Status:** Approved (brainstorming phase complete)
**Scope:** Layout-only refactor of `/account`. No new features.

## Problem

The left sidebar (avatar card) is too wide while the right (profile edit form) is cramped at 380px, making the page feel unbalanced on desktop. Current rule:

```css
.account-grid { grid-template-columns: 1fr 380px; }
```

gives the avatar card the entire leftover space (huge) and pins the form to a narrow column.

## Goal

Side-by-side on desktop with a narrow avatar sidebar and a wide profile form. Stack cleanly on tablet and mobile. Single CSS file touched.

## Design

### Grid (replacement CSS)

```css
.account-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--t-grid-gutter);
  align-items: start;
}

@media (max-width: 1024px) {
  .cart-layout,
  .checkout-grid,
  .account-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .account-grid > :first-child {
    max-width: 360px;
  }
}

@media (max-width: 768px) {
  .account-grid > :first-child {
    max-width: 100%;
  }
}
```

### Layout behaviour by breakpoint

| Breakpoint      | Columns                       | Avatar card width        |
|-----------------|-------------------------------|--------------------------|
| ≥ 1025px        | `280px 1fr`                   | 280px                    |
| 769–1024px      | `1fr` (stack)                 | max 360px                |
| ≤ 768px         | `1fr` (stack)                 | 100%                     |

### Why `align-items: start`

Avatar card content is short; without `start` it stretches to match form height, leaving dead space. The form is taller by design (fields, divider, button row) — let it grow, sidebar sizes to its content.

### Components (no change in component code)

`Account.js` markup, `Card`/`CardBody`/`Field`/`FieldRow`/`PrimaryBtn` usage — all unchanged. Only the grid container rule changes.

## Out of Scope (YAGNI)

- Avatar shape/styling changes
- Password strength meter
- Address book / shipping addresses
- Email change re-auth flow
- New tokens; reuses `--t-grid-gutter` from existing design system

## Files Touched

- `frontend/src/design/tokens-css.js` — `.account-grid` block + the 1024px breakpoint block; `.account-grid > :first-child` rules added for stacked widths.

## Testing

Behaviour unchanged apart from width. No Jest, Playwright, or test-fixture updates required. Manual visual verify at desktop (1440 / 1024) and mobile (390 / 768) widths.

## Risk

- **Low.** CSS-only change. Container max widths stay bounded by `--t-grid-containerMax`; avatar cap of 360px in tablet prevents awkward single-line stragglers.
