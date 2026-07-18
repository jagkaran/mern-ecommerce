// components/Admin/AdminMobileNav.jsx
// Mobile-only horizontal pill row for jumping between admin sections. Sits
// just below the global Header so admins don't have to drill through the
// hamburger → Account → Dashboard path to switch pages on phones/tablets.
// Hidden on md+ where the permanent DashboardDrawer already does this job.

import { Box } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Products", to: "/admin/products" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Customers", to: "/admin/users" },
];

export default function AdminMobileNav() {
  const { pathname } = useLocation();
  return (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        gap: 1,
        overflowX: "auto",
        paddingBlock: 1.5,
        paddingInline: 1,
        borderBottom: "1px solid var(--t-neutral-200)",
        marginBottom: 2,
        backgroundColor: "var(--t-neutral-50)",
      }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.to;
        return (
          <Box
            key={item.to}
            component={Link}
            to={item.to}
            sx={{
              flexShrink: 0,
              paddingInline: 2,
              paddingBlock: 0.75,
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
              color: active ? "#fff" : "var(--t-neutral-700)",
              backgroundColor: active ? "var(--t-primary-600)" : "var(--t-neutral-100)",
              transition: "background-color 150ms cubic-bezier(0, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: active ? "var(--t-primary-700)" : "var(--t-neutral-200)",
              },
            }}
          >
            {item.label}
          </Box>
        );
      })}
    </Box>
  );
}
