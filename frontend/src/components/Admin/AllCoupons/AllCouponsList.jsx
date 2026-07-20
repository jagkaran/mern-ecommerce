import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { useToast } from "../../../hooks/useToast";
import { Card, CardBody, Overline, BodyText, GhostBtn } from "../../../design/primitives";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";
import { clearCouponErrors, deleteCoupon, toggleCoupon } from "../../../actions/couponAction";

// Derive a human label for the coupon's lifecycle state. Drives both the
// status chip and the toggle action so they always agree.
function statusOf(coupon) {
  if (!coupon.active) return { label: "Inactive", tone: "neutral" };
  const now = Date.now();
  if (coupon.startAt && new Date(coupon.startAt).getTime() > now) {
    return { label: "Scheduled", tone: "info" };
  }
  if (coupon.endAt && new Date(coupon.endAt).getTime() < now) {
    return { label: "Expired", tone: "warn" };
  }
  return { label: "Active", tone: "positive" };
}

function StatusChip({ label, tone }) {
  const palette = {
    positive: { bg: "var(--t-semantic-success-bg, #e6f4ec)", fg: "#1f7a3a" },
    warn: { bg: "var(--t-semantic-warning-bg, #fdf3da)", fg: "#8a5a00" },
    info: { bg: "var(--t-semantic-info-bg, #e6efff)", fg: "#1a3f8a" },
    neutral: { bg: "var(--t-neutral-100)", fg: "var(--t-neutral-700)" },
  }[tone] || { bg: "var(--t-neutral-100)", fg: "var(--t-neutral-700)" };
  return (
    <span
      style={{
        background: palette.bg,
        color: palette.fg,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function DiscountBadge({ type, value }) {
  const label =
    type === "percentage"
      ? `${value}% off`
      : type === "flat"
        ? `$${value} off`
        : type === "freeShipping"
          ? "Free shipping"
          : type === "tiered"
            ? "Tiered"
            : type === "bogo"
              ? "BOGO"
              : type;
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 4,
        background: "var(--t-neutral-100)",
        color: "var(--t-neutral-700)",
      }}
    >
      {label}
    </span>
  );
}

function AllCouponsList({ coupons }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isDeleted, isToggled, error } = useSelector((s) => s.coupon);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const { page, perPage, totalPages, paginated, setPage, setPerPage } = useAdminPagination(
    coupons,
    10
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponErrors());
    }
    if (isDeleted) {
      toast.success("Coupon deleted");
      dispatch({ type: "ResetCouponFlags" });
    }
    if (isToggled) {
      toast.success("Coupon status updated");
      dispatch({ type: "ResetCouponFlags" });
    }
  }, [error, isDeleted, isToggled, toast, dispatch]);

  if (!coupons || coupons.length === 0) {
    return (
      <Card>
        <CardBody>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid var(--t-neutral-200)",
            }}
          >
            <Overline>All Coupons</Overline>
            <GhostBtn
              component={Link}
              to="/admin/coupon/new"
              size="small"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AddIcon fontSize="small" /> New
            </GhostBtn>
          </div>
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <BodyText style={{ color: "var(--t-neutral-400)" }}>
              No coupons yet. Create your first promotion to get started.
            </BodyText>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--t-neutral-200)",
          }}
        >
          <Overline>All Coupons</Overline>
          <GhostBtn
            component={Link}
            to="/admin/coupon/new"
            size="small"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <AddIcon fontSize="small" /> New
          </GhostBtn>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--t-fontSize-sm)",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--t-neutral-200)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {["Code", "Name", "Discount", "Used", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--t-neutral-500)",
                      fontSize: "var(--t-fontSize-xs)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((coupon) => {
                const status = statusOf(coupon);
                const usedLabel = coupon.usageLimit
                  ? `${coupon.usedCount || 0} / ${coupon.usageLimit}`
                  : `${coupon.usedCount || 0} / ∞`;
                return (
                  <tr
                    key={coupon._id}
                    style={{
                      borderBottom: "1px solid var(--t-neutral-100)",
                      transition:
                        "background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-neutral-50)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 600 }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{coupon.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <DiscountBadge type={coupon.discountType} value={coupon.discountValue} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--t-neutral-600)" }}>
                      {usedLabel}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusChip label={status.label} tone={status.tone} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <GhostBtn
                          size="small"
                          onClick={() => dispatch(toggleCoupon(coupon._id))}
                          title={coupon.active ? "Deactivate" : "Activate"}
                        >
                          {coupon.active ? "Pause" : "Resume"}
                        </GhostBtn>
                        <Link
                          to={`/admin/coupon/update/${coupon._id}`}
                          style={{ color: "var(--t-neutral-500)", textDecoration: "none" }}
                        >
                          ✎
                        </Link>
                        <GhostBtn
                          size="small"
                          onClick={() => setConfirmDelete(coupon)}
                          style={{ color: "var(--t-semantic-error)" }}
                        >
                          ✕
                        </GhostBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "1px solid var(--t-neutral-200)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              Rows per page:
            </BodyText>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={{
                fontSize: "0.875rem",
                border: "1px solid var(--t-neutral-300)",
                borderRadius: "var(--t-border-radius-base)",
                padding: "2px 8px",
                background: "var(--t-neutral-50)",
                color: "var(--t-neutral-700)",
              }}
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <GhostBtn
              size="small"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              ‹
            </GhostBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <GhostBtn
                key={p}
                size="small"
                onClick={() => setPage(p)}
                style={{
                  background: p === page ? "var(--t-primary-600)" : "transparent",
                  color: p === page ? "#fff" : "var(--t-neutral-700)",
                  borderColor: p === page ? "var(--t-primary-600)" : "var(--t-neutral-300)",
                }}
              >
                {p}
              </GhostBtn>
            ))}
            <GhostBtn
              size="small"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              ›
            </GhostBtn>
          </div>
        </div>
      </CardBody>

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "var(--t-neutral-50)",
              borderRadius: "var(--t-border-radius-base)",
              padding: 24,
              maxWidth: 400,
              width: "90%",
              boxShadow: "var(--t-shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12 }}>Delete &ldquo;{confirmDelete.code}&rdquo;?</h3>
            <BodyText style={{ color: "var(--t-neutral-500)", marginBottom: 20 }}>
              This permanently removes the coupon. Active customer carts using this code will see it
              stop working on the next request.
            </BodyText>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <GhostBtn size="small" onClick={() => setConfirmDelete(null)}>
                Cancel
              </GhostBtn>
              <GhostBtn
                size="small"
                onClick={() => {
                  dispatch(deleteCoupon(confirmDelete._id));
                  setConfirmDelete(null);
                }}
                style={{
                  color: "var(--t-semantic-error)",
                  borderColor: "var(--t-semantic-error)",
                }}
              >
                Delete
              </GhostBtn>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AllCouponsList;
