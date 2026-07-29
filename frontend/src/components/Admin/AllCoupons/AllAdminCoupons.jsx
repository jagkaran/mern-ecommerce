import * as React from "react";
import Box from "@mui/material/Box";
import { CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { getAdminCoupons, clearCouponErrors } from "../../../actions/couponAction";
import AllCouponsList from "./AllCouponsList";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";

function AllAdminCoupons() {
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
      <Seo
        title="Manage Coupons - Click.it Dashboard - Admin access only"
        description="Dashboard to manage promotional coupons"
        path="/admin/coupons"
      />
      <Box sx={{ padding: "16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {loading && (!allCoupons || allCoupons.length === 0) ? (
            <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
              <CircularProgress />
            </div>
          ) : (
            <AllCouponsList coupons={allCoupons || []} />
          )}
        </div>
      </Box>
    </>
  );
}

export default AllAdminCoupons;
