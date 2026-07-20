import React from "react";
import { Box } from "@mui/material";
import DashboardAppBar from "./Sidebar/DashboardAppBar";
import DashboardDrawer from "./Sidebar/DashboardDrawer";
import AdminMobileNav from "./AdminMobileNav";
import AllOrders from "./DashboardContent/AllOrders";
import AllProducts from "./DashboardContent/AllProducts";
import AllUsers from "./DashboardContent/AllUsers";
import TotalRevenue from "./DashboardContent/TotalRevenue";
import InventoryOverview from "./DashboardContent/InventoryOverview";
import LastestSales from "./DashboardContent/LastestSales";
import { useDispatch, useSelector } from "react-redux";
import { getAdminProducts } from "../../actions/productAction";
import { getAllOrders } from "../../actions/orderAction";
import { getAllUsers } from "../../actions/userAction";
import { Link } from "react-router-dom";
import Seo from "../Seo";

export default function Dashboard() {
  const [open, setOpen] = React.useState(false);

  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.product);
  const { orders, orderCount, totalAmount } = useSelector((state) => state.allOrders);
  const { usersCount } = useSelector((state) => state.allUsers);

  let outOfStock = 0;
  products &&
    products.forEach((item) => {
      if (item?.stock === 0) {
        outOfStock += 1;
      }
    });

  React.useEffect(() => {
    dispatch(getAdminProducts());
    dispatch(getAllOrders());
    dispatch(getAllUsers());
  }, [dispatch]);

  return (
    <>
      <Seo
        title="Ordinary — Dashboard"
        description="Admin dashboard for managing products, orders, users and reviews"
        path="/dashboard"
      />
      <div style={{ display: "flex" }}>
        <DashboardAppBar open={open} handleDrawerOpen={() => setOpen(true)} />
        <DashboardDrawer open={open} handleDrawerClose={() => setOpen(false)} />
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <AdminMobileNav />
          <Box
            sx={{
              paddingTop: { xs: 16, md: 24 },
              paddingBottom: { xs: 32, md: 48 },
              paddingInline: { xs: 2, md: "var(--t-space-lg)" },
              maxWidth: "var(--t-grid-containerMax)",
              marginInline: "auto",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: { xs: 2, md: "var(--t-space-md)" },
              }}
            >
              <Link to="/admin/orders" style={{ textDecoration: "none" }}>
                <AllOrders allOrders={orderCount ?? (orders && orders.length)} />
              </Link>
              <Link to="/admin/products" style={{ textDecoration: "none" }}>
                <AllProducts allProducts={products && products.length} />
              </Link>
              <Link to="/admin/users" style={{ textDecoration: "none" }}>
                <AllUsers allUserCount={usersCount && usersCount} />
              </Link>
              <TotalRevenue totalRevenue={totalAmount ?? 0} />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                gap: { xs: 2, md: "var(--t-space-md)" },
                marginTop: { xs: 2, md: "var(--t-space-md)" },
              }}
            >
              <LastestSales totalRevenue={totalAmount ?? 0} />
              <InventoryOverview outOfStock={outOfStock} inStock={products?.length - outOfStock} />
            </Box>
          </Box>
        </Box>
      </div>
    </>
  );
}
