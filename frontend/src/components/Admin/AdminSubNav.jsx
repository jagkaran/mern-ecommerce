// components/Admin/AdminSubNav.jsx
// Sticky sub-nav rendered by AdminLayout for /admin/* and /dashboard routes.
// Replaces the old DashboardAppBar + DashboardDrawer + AdminMobileNav triplet.
// Hides itself on edit pages so the page chrome stays focused.

import { Link, useLocation } from "react-router-dom";

const ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Products", to: "/admin/products" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Customers", to: "/admin/users" },
];

const HIDE_ON = [
  /^\/admin\/product\/(new|update\/[^/]+)$/,
  /^\/admin\/order\/update\/[^/]+$/,
  /^\/admin\/user\/update\/[^/]+$/,
  /^\/admin\/coupon\/(new|update\/[^/]+)$/,
];

export default function AdminSubNav() {
  const { pathname } = useLocation();
  if (HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <nav
      aria-label="Admin sections"
      style={{
        position: "sticky",
        top: "var(--t-headerHeight)",
        zIndex: 1090,
        backgroundColor: "var(--t-neutral-50)",
        borderBottom: "1px solid var(--t-neutral-200)",
        height: 48,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingLeft: "max(16px, var(--t-grid-containerPad))",
          paddingRight: "max(16px, var(--t-grid-containerPad))",
          maxWidth: "var(--t-grid-containerMax)",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
        }}
      >
        {ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                flexShrink: 0,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                whiteSpace: "nowrap",
                color: active ? "#fff" : "var(--t-neutral-700)",
                backgroundColor: active ? "var(--t-primary-600)" : "var(--t-neutral-100)",
                transition: "background-color 150ms cubic-bezier(0, 0, 0.2, 1)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}