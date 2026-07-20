import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import AdminMobileNav from "../AdminMobileNav";
import { CircularProgress, Container, Grid } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import AllOrdersList from "./AllOrdersList";
import { clearErrors, getAllOrders, deleteOrder } from "../../../actions/orderAction";
import { useNavigate } from "react-router-dom";
import Seo from "../../Seo";

function AllAdminOrders() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const toast = useToast();
  const history = useNavigate();

  const { loading, error, orders } = useSelector((state) => state.allOrders);

  const { error: deleteError, isDeleted } = useSelector((state) => state.modifiedOrder);

  function sortByDate(a, b) {
    if (a.createdAt < b.createdAt) {
      return 1;
    }
    if (a.createdAt > b.createdAt) {
      return -1;
    }
    return 0;
  }

  const sortedOrdersArrayByDate = orders.slice().sort(sortByDate);

  const deleteOrderHandler = (id) => {
    dispatch(deleteOrder(id));
  };

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (deleteError) {
      toast.error(deleteError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      toast.success("Order Deleted Successfully");
      history("/dashboard");
      dispatch({ type: "DeleteOrderReset" });
    }
    dispatch(getAllOrders());
  }, [dispatch, error, toast, deleteError, history, isDeleted]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Manage Orders - Click.it Dashboard - Admin access only"
          description="Dashboard to manage orders"
          path="/admin/orders"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer open={open} handleDrawerClose={handleDrawerClose} theme={theme} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 8,
          }}
        >
          <AdminMobileNav />
          <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {loading ? (
                  <div className="grid place-items-center h-screen">
                    <CircularProgress />
                  </div>
                ) : (
                  <AllOrdersList
                    orders={orders && sortedOrdersArrayByDate}
                    deleteOrderHandler={deleteOrderHandler}
                  />
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default AllAdminOrders;
