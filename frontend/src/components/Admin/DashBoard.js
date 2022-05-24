import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "./Sidebar/DashboardAppBar";
import DashboardDrawer from "./Sidebar/DashboardDrawer";
import LastestSales from "./DashboardContent/LastestSales";
import { Container, Grid } from "@mui/material";
import AllOrders from "./DashboardContent/AllOrders";
import AllProducts from "./DashboardContent/AllProducts";
import AllUsers from "./DashboardContent/AllUsers";
import TotalRevenue from "./DashboardContent/TotalRevenue";
import InventoryOverview from "./DashboardContent/InventoryOverview";
import { useSelector, useDispatch } from "react-redux";
import { getAdminProducts } from "../../actions/productAction";
import { getAllOrders } from "../../actions/orderAction";
import { getAllUsers } from "../../actions/userAction";
import { Link } from "react-router-dom";
import Seo from "../Seo";
import Copyright from "../Copyright";

export default function Dashboard() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();

  const { products } = useSelector((state) => state.product);

  const { orders } = useSelector((state) => state.allOrders);

  const { usersCount } = useSelector((state) => state.allUsers);

  let outOfStock = 0;

  products &&
    products.forEach((item) => {
      if (item?.stock === 0) {
        outOfStock += 1;
      }
    });

  let totalAmount = 0;
  orders &&
    orders.forEach((item) => {
      totalAmount += item.totalPrice;
    });

  React.useEffect(() => {
    dispatch(getAdminProducts());
    dispatch(getAllOrders());
    dispatch(getAllUsers());
  }, [dispatch]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Click.it Dashboard - Admin access only"
          description="Dashboard to manage products, orders, users and reviews"
          path="/dashboard"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer
          open={open}
          handleDrawerClose={handleDrawerClose}
          theme={theme}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 8,
          }}
        >
          <Container maxWidth={false}>
            <Grid container spacing={3}>
              <Grid item lg={3} sm={6} xl={3} xs={12}>
                <Link to="/admin/orders">
                  <AllOrders allOrders={orders && orders.length} />
                </Link>
              </Grid>
              <Grid item xl={3} lg={3} sm={6} xs={12}>
                <Link to="/admin/products">
                  <AllProducts allProducts={products && products.length} />
                </Link>
              </Grid>
              <Grid item xl={3} lg={3} sm={6} xs={12}>
                <Link to="/admin/users">
                  <AllUsers allUserCount={usersCount && usersCount} />
                </Link>
              </Grid>
              <Grid item xl={3} lg={3} sm={6} xs={12}>
                <TotalRevenue totalRevenue={totalAmount} />
              </Grid>
              <Grid item lg={8} md={12} xl={9} xs={12}>
                <LastestSales totalRevenue={totalAmount} />
              </Grid>
              <Grid item lg={4} md={12} xl={3} xs={12}>
                <InventoryOverview
                  outOfStock={outOfStock}
                  inStock={products?.length - outOfStock}
                  sx={{ height: "100%" }}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Copyright />
    </>
  );
}
