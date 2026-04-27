import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import { CircularProgress, Container, Grid } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getAdminProducts } from "../../../actions/productAction";
import AllProductsList from "./AllProductsList";
import { useAlert } from "react-alert";
import Seo from "../../Seo";
import Copyright from "../../Copyright";

function AllAdminProducts() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen  = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const dispatch = useDispatch();
  const alert    = useAlert();

  const { loading, error, products } = useSelector((state) => state.product);

  // Re-fetch every time this page mounts so a freshly created product
  // appears immediately without requiring a manual browser refresh.
  React.useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    dispatch(getAdminProducts());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Error side-effect handled separately so it doesn’t re-trigger the fetch
  React.useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
  }, [error, alert, dispatch]);

  // Backend already returns products sorted newest-first, but keep the
  // client-side sort as a safety net in case the order ever changes.
  const sortedProducts = (products || []).slice().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Manage Products - Click.it Dashboard - Admin access only"
          description="Dashboard to manage products and reviews"
          path="/admin/products"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer
          open={open}
          handleDrawerClose={handleDrawerClose}
          theme={theme}
        />
        <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
          <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {loading ? (
                  <div className="grid place-items-center h-screen">
                    <CircularProgress />
                  </div>
                ) : (
                  <AllProductsList products={sortedProducts} />
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Copyright />
    </>
  );
}

export default AllAdminProducts;
