import React, { useState } from "react";
import { Link } from "react-router-dom";
import AdminTable from "../../../design/AdminTable";
import { Overline, Headline, BodyText, GhostBtn, SeverityPill } from "../../../design/primitives";
import { createOrderNumber } from "../../Order/MyOrders";
import { fmtInCurrency } from "../../../utils/fmtInCurrency";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";

const PILL_COLOR = {
  Delivered: "success",
  Shipped: "info",
  Processing: "warning",
  Cancelled: "error",
};

function statusColor(status) {
  return PILL_COLOR[status] || "error";
}

function AllOrdersList({ orders, deleteOrderHandler }) {
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState({});

  const { page, perPage, totalPages, paginated, setPage, setPerPage } = useAdminPagination(
    orders,
    10
  );

  const handleClickOpen = (order) => {
    setOpen(true);
    setSelectedOrder(order);
  };
  const handleClose = () => setOpen(false);

  const deleteOrder = (id) => {
    deleteOrderHandler(id);
    setOpen(false);
  };

  if (!orders || orders.length === 0) {
    return (
      <BodyText style={{ color: "var(--t-neutral-400)" }}>No orders found.</BodyText>
    );
  }

  return (
    <AdminTable stickyPage>
      <colgroup>
        <col style={{ width: "minmax(140px, 1.4fr)" }} />
        <col style={{ width: "minmax(120px, 1fr)" }} />
        <col style={{ width: "minmax(80px, 0.6fr)" }} />
        <col style={{ width: "minmax(110px, 1fr)" }} />
        <col style={{ width: "minmax(110px, 0.8fr)" }} />
      </colgroup>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--t-neutral-200)",
          gridColumn: "1 / -1",
        }}
      >
        <Overline>All Orders</Overline>
        <Headline level="xl" style={{ fontSize: "var(--t-fontSize-xl)" }}>
          {orders.length}
        </Headline>
      </div>

      <thead>
        <tr>
          {["Order ID", "Status", "Items", "Amount", "Actions"].map((h) => (
            <th key={h} style={AdminTable.thStyle}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {paginated.map((order) => (
          <tr
            key={order._id}
            style={{
              borderBottom: "1px solid var(--t-neutral-100)",
              transition:
                "background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-neutral-50)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <td style={{ ...AdminTable.tdStyle, fontWeight: 500 }}>
              {createOrderNumber(order._id, order.shippingInfo?.country)}
            </td>
            <td style={AdminTable.tdStyle}>
              <SeverityPill color={statusColor(order.orderStatus)}>
                {order.orderStatus}
              </SeverityPill>
            </td>
            <td style={{ ...AdminTable.tdStyle, color: "var(--t-neutral-600)" }}>
              {order.orderItems?.length || 0}
            </td>
            <td style={{ ...AdminTable.tdStyle, color: "var(--t-neutral-600)" }}>
              {fmtInCurrency(
                order.totalPrice,
                order.currency || "USD",
                order.currencyRate || 1
              )}
            </td>
            <td style={AdminTable.tdStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Link
                  to={`/admin/order/update/${order._id}`}
                  style={{
                    color: "var(--t-neutral-500)",
                    textDecoration: "none",
                    transition: "color 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-primary-600)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-neutral-500)")}
                >
                  ✎
                </Link>
                <GhostBtn
                  size="small"
                  onClick={() => handleClickOpen(order)}
                  style={{ color: "var(--t-neutral-400)" }}
                >
                  ✕
                </GhostBtn>

                {open && selectedOrder._id === order._id && (
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
                    onClick={handleClose}
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
                      <Headline level="lg" style={{ marginBottom: 12 }}>
                        Delete Confirmation
                      </Headline>
                      <BodyText
                        style={{
                          color: "var(--t-neutral-500)",
                          marginBottom: 20,
                        }}
                      >
                        Are you sure you want to delete "
                        {createOrderNumber(
                          selectedOrder._id,
                          selectedOrder.shippingInfo?.country
                        )}
                        " order?
                      </BodyText>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <GhostBtn size="small" onClick={handleClose}>
                          Cancel
                        </GhostBtn>
                        <GhostBtn
                          size="small"
                          onClick={() => deleteOrder(selectedOrder._id)}
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
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <BodyText small style={{ color: "var(--t-neutral-500)" }}>
                  {Math.min((page - 1) * perPage + 1, orders.length)}–
                  {Math.min(page * perPage, orders.length)} of {orders.length}
                </BodyText>
                <div style={{ display: "flex", gap: 4 }}>
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
            </div>
          </td>
        </tr>
      </tfoot>
    </AdminTable>
  );
}

export default AllOrdersList;