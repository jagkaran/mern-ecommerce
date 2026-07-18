# Codebase Audit + SOLID Plan — Hverdag Frontend

**Baseline:** BE 189/189 · FE 13/13 = **202/202 tests green**.

**Estimated total time:** 90–120 minutes of focused work. Below is the plan, ordered by safety × value. After completion I'll report time spent.

---

## Time estimate breakdown

| Band                          | What                                                                                                                                           | Time est     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1 — Cleanup                   | Delete/rename dead files + dead imports                                                                                                        | 15 min       |
| 2 — Bug fixes                 | Audit-flagged UI/UX bugs (most are 1–2 line fixes)                                                                                             | 30 min       |
| 3 — Tests                     | Add tests for critical components: Wishlist hook/reducer, Basket Qty/Remove, Header mobile drawer, NotFound + Footer + Account bug regressions | 30 min       |
| 4 — .gitignore + temp cleanup | Remove all screenshots from working tree; commit `.gitignore` entries                                                                          | 10 min       |
| 5 — Verification              | Build + Playwright E2E sweep of every page                                                                                                     | 15 min       |
| **Total**                     |                                                                                                                                                | **~1.5–2 h** |

Out of scope this session (would each be 1+ hour on its own):

- Migrate `react-alert` → toast slice (touches every page)
- Migrate `react-helmet` → `react-helmet-async`
- CSRF singleton → `useRef`
- `localStorage` PII audit + move to `sessionStorage`/in-memory
- Avatar dataURL → multipart FormData migration
- Wholesale conversion from CommonJS Redux thunks → RTK Query
- Header.js 470-LOC split into hooks + subcomponents (large)
- Coupon UI (backend rule exists; no frontend)

---

## BAND 1 — Dead-file cleanup (no functional change)

| #    | Action                                                                                                               | Reason                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1.1  | Delete `frontend/src/components/Product/ProductDetails.js` (407 LOC)                                                 | Never imported; V2 replaced it                                     |
| 1.2  | Delete `frontend/src/components/Checkout/StripeCardNumberInput.js`, `StripeCardExpInput.js`, `StripeCardCVCInput.js` | Shims that nothing imports                                         |
| 1.3  | Delete `frontend/src/components/EmptyCart.js`                                                                        | Only used by `UpdatePassword.js` for a wrong-image reference       |
| 1.4  | Delete `frontend/src/components/ZeroOrders.js`                                                                       | Never imported                                                     |
| 1.5  | Delete `frontend/src/hooks/useShippingForm.js`                                                                       | Never imported (Shipping.js uses inline useState)                  |
| 1.6  | Delete `frontend/src/utils/fmt.js`                                                                                   | One-line re-export shim; nothing imports it                        |
| 1.7  | Delete `frontend/src/components/Product/ProductCard.js` shim, rename `.jsx` → `.js`                                  | Shim was a workaround during the .jsx/.js duplicate-file collision |
| 1.8  | Remove dead import in `OrderItemsCard.js` (`OrderItemGrid` import)                                                   | Listed but unused                                                  |
| 1.9  | Remove dead `useEffect`/`useNavigate` in `Wishlist.js` (lines 17, 29–33)                                             | No-op                                                              |
| 1.10 | Remove dead Tailwind classes in `Copyright.js` (no Tailwind in project)                                              | Cosmetic dead code                                                 |

## BAND 2 — Audit-flagged bug fixes

| #   | File:line                                       | Fix                                                                                    |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2.1 | `Order/MyOrders.js:122–134`                     | Hoist `Date ↕` header out of the array to fix nested `<th><th>` invalid HTML           |
| 2.2 | `NotFound.js:12`                                | Replace stale title `"404: Oops - Click.it Store"` with Hverdag voice                  |
| 2.3 | `Success.js:6–12`                               | Replace local `fmtInCurrency` with `utils/fmtInCurrency.js`                            |
| 2.4 | `hooks/useWishlist.js:37–41`                    | Stop forcing `navigate("/signin")` on anon tap; rely on Wishlist page auth CTA instead |
| 2.5 | `Order/MyOrders.js:189–209`                     | Replace inline status-pill map with the existing `SeverityPill` component              |
| 2.6 | `Home/Footer.js:6–34`                           | Replace hardcoded category slugs with `state.categories` from store                    |
| 2.7 | `Home/Header.js:101–122`                        | Replace `mobileArrList` positional-index trick with `{name, icon, href}` registry      |
| 2.8 | `Cart/Basket.js` raw axios → `productsApiSlice` | DIP: remove direct transport from component                                            |

## BAND 3 — Critical-component tests

| #   | Component                                              | What to cover                                                                                    |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 3.1 | `hooks/useWishlist.js` + `reducers/wishlistReducer.js` | toggle adds, toggle removes, anon click does not navigate, optimistic rollback on failure        |
| 3.2 | `Cart/Basket.js`                                       | QtyStepper increment/decrement, Remove removes from store, empty state renders when cart cleared |
| 3.3 | `Home/Header.js` mobile drawer                         | Wishlist entry navigates to `/wishlist`, Account triggers login popup when anon                  |
| 3.4 | `NotFound.js`                                          | Page renders without crashing + Hverdag copy                                                     |
| 3.5 | `Order/MyOrders.js`                                    | Table renders rows with `SeverityPill`, no nested `<th>` (regression)                            |

## BAND 4 — `.gitignore` + temp cleanup

- Add: `*.png` (or `screenshots/`), `tmp-*`, `playwright-report/`, `.playwright-mcp/`
- Remove existing `v[0-9]*.png`, `home-*.png`, etc. from working tree before commit
- Delete `/tmp/hverdag-*.log` (local only)

## BAND 5 — E2E verification (Playwright)

Walk every route, screenshot desktop + mobile, capture console + network:

- `/`, `/products`, `/products/:keyword`, `/product/:id`, `/cart`, `/signin`, `/signup`, `/search`, `/wishlist`, `/account`, `/myorders`, `/aboutus`, `/notfound`
- Verify Remove actually removes (already done in v13)
- Verify Wishlist heart toggle adds/removes
- Verify no `404 · Click.it` text leaks anywhere
- Verify mobile drawer Wishlist entry navigates correctly

---

## Tracking

After each band: re-run tests, log result to `docs/superpowers/plans/audit-results.log`.
