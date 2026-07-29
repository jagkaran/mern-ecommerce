import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { createCoupon, clearCouponErrors } from "../../../actions/couponAction";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";
import CouponForm, { EMPTY_COUPON } from "./CouponForm";

function CreateCoupon() {
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
    <div style={{ padding: 16 }}>
      <Seo title="New coupon" path="/admin/coupon/new" />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
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
      </div>
    </div>
  );
}

export default CreateCoupon;