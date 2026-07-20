import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { Container, CircularProgress } from "@mui/material";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import AdminMobileNav from "../AdminMobileNav";
import { createCoupon, clearCouponErrors } from "../../../actions/couponAction";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";
import CouponForm, { EMPTY_COUPON } from "./CouponForm";

function CreateCoupon() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const { loading, isCreated, error } = useSelector((s) => s.coupon);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponErrors());
    }
    if (isCreated) {
      toast.success("Coupon created");
      dispatch({ type: "ResetCouponFlags" });
      navigate("/admin/coupons");
    }
  }, [error, isCreated, toast, dispatch, navigate]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    const result = await dispatch(createCoupon(payload));
    setSubmitting(false);
    if (result && result.ok === false) {
      toast.error(result.error || "Failed to create coupon");
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Seo title="New coupon" path="/admin/coupon/new" />
      <CssBaseline />
      <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <DashboardDrawer open={open} handleDrawerClose={handleDrawerClose} theme={theme} />
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <AdminMobileNav />
        <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
          {loading && submitting ? (
            <CircularProgress />
          ) : (
            <CouponForm
              initialValues={EMPTY_COUPON}
              onSubmit={handleSubmit}
              busy={submitting}
              submitLabel="Create coupon"
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default CreateCoupon;
