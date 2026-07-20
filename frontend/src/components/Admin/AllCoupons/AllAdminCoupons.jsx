import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import AdminMobileNav from "../AdminMobileNav";
import { CircularProgress, Container, Grid } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { getAdminCoupons, clearCouponErrors } from "../../../actions/couponAction";
import AllCouponsList from "./AllCouponsList";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";

function AllAdminCoupons() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const dispatch = useDispatch();
  const toast = useToast();

  const { loading, error, allCoupons } = useSelector((state) => state.coupon);

  React.useEffect(() => {
    dispatch(getAdminCoupons());
  }, [dispatch]);

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponErrors());
    }
  }, [error, toast, dispatch]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Manage Coupons - Click.it Dashboard - Admin access only"
          description="Dashboard to manage promotional coupons"
          path="/admin/coupons"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer open={open} handleDrawerClose={handleDrawerClose} theme={theme} />
        <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
          <AdminMobileNav />
          <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                {loading && (!allCoupons || allCoupons.length === 0) ? (
                  <div className="grid place-items-center h-screen">
                    <CircularProgress />
                  </div>
                ) : (
                  <AllCouponsList coupons={allCoupons || []} />
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default AllAdminCoupons;
