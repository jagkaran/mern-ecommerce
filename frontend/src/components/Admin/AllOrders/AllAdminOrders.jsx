import * as React from "react";
import Box from "@mui/material/Box";
import { CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import AllOrdersList from "./AllOrdersList";
import { clearErrors, getAllOrders, deleteOrder } from "../../../actions/orderAction";
import { useNavigate } from "react-router-dom";
import Seo from "../../Seo";

function AllAdminOrders() {
  const dispatch = useDispatch();
  const toast = useToast();
  const history = useNavigate();

  const { loading, error, orders, orderCount } = useSelector((state) => state.allOrders);

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
      <Seo
        title="Manage Orders - Click.it Dashboard - Admin access only"
        description="Dashboard to manage orders"
        path="/admin/orders"
      />
      <Box sx={{ padding: "16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {loading ? (
            <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
              <CircularProgress />
            </div>
          ) : (
            <AllOrdersList
              orders={orders && sortedOrdersArrayByDate}
              totalCount={orderCount}
              deleteOrderHandler={deleteOrderHandler}
            />
          )}
        </div>
      </Box>
    </>
  );
}

export default AllAdminOrders;
