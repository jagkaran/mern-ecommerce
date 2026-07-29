import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import axios from "axios";
import { updateCoupon, clearCouponErrors } from "../../../actions/couponAction";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";
import CouponForm from "./CouponForm";

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function UpdateCoupon() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const { error } = useSelector((s) => s.coupon);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`/api/v1/admin/coupon/${id}`);
        if (!active) return;
        setInitialValues({
          ...data.coupon,
          startAt: toLocalInput(data.coupon.startAt),
          endAt: toLocalInput(data.coupon.endAt),
          usageLimit: data.coupon.usageLimit ?? "",
          discountValue: data.coupon.discountValue ?? "",
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load coupon");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, toast]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponErrors());
    }
  }, [error, toast, dispatch]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    // code is immutable — strip before sending so the BE validation doesn't
    // reject the update. Everything else is allowed to be re-sent as-is.
    const { code: _omit, ...rest } = payload;
    const result = await dispatch(updateCoupon(id, rest));
    setSubmitting(false);
    if (result && result.ok === false) {
      toast.error(result.error || "Failed to update coupon");
    } else {
      toast.success("Coupon updated");
      navigate("/admin/coupons");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Seo title="Edit coupon" path={`/admin/coupon/update/${id}`} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {loading ? (
          <CircularProgress />
        ) : initialValues ? (
          <CouponForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            busy={submitting}
            submitLabel="Save changes"
          />
        ) : (
          <div>Coupon not found.</div>
        )}
      </div>
    </div>
  );
}

export default UpdateCoupon;