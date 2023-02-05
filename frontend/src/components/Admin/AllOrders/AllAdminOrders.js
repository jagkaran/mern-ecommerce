import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import { CircularProgress, Container, Grid } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useAlert } from "react-alert";
import AllOrdersList from "./AllOrdersList";
import {
  clearErrors,
  getAllOrders,
  deleteOrder,
} from "../../../actions/orderAction";
import { useNavigate } from "react-router-dom";
import Seo from "../../Seo";
import Copyright from "../../Copyright";

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
  const alert = useAlert();
  const history = useNavigate();

  const { loading, error, orders } = useSelector((state) => state.allOrders);

  const { error: deleteError, isDeleted } = useSelector(
    (state) => state.modifiedOrder
  );

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
      alert.error(error);
      dispatch(clearErrors());
    }
    if (deleteError) {
      alert.error(deleteError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      alert.success("Order Deleted Successfully");
      history("/dashboard");
      dispatch({ type: "DeleteOrderReset" });
    }
    dispatch(getAllOrders());
  }, [dispatch, error, alert, deleteError, history, isDeleted]);

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
      <Copyright />
    </>
  );
}

export default AllAdminOrders;
