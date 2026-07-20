import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { clearErrors, myOrders } from "../../actions/orderAction";
import Seo from "../Seo";
import SeverityPill from "./SeverityPill";
import {
  Card,
  CardBody,
  Overline,
  Headline,
  BodyText,
  Price,
  PrimaryBtn,
  GhostBtn,
  Table,
} from "../../design/primitives";
import { fmtInCurrency } from "../../utils/fmtInCurrency";
import { format, parseISO } from "date-fns";

export const createOrderNumber = (id, country) => {
  if (!id || !country) return "";
  return country + id.replace(/\D/g, "").substring(0, 8);
};

const STATUS_VARIANT = {
  Delivered: "success",
  Processing: "warning",
  Shipped: "info",
};

function dateValue(o) {
  return o.createdAt ? new Date(o.createdAt).getTime() : 0;
}

function MyOrders() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { loading, error, orders = [], ordersCount = 0 } = useSelector((state) => state.myOrders);
  const { user } = useSelector((state) => state.user);
  const [sort, setSort] = useState({ by: "createdAt", dir: "desc" });
  const navigate = useNavigate();

  const sortedRows = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...orders].sort((a, b) => {
      const av = sort.by === "createdAt" ? dateValue(a) : a[sort.by];
      const bv = sort.by === "createdAt" ? dateValue(b) : b[sort.by];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [orders, sort]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      dispatch(clearErrors());
    }
    dispatch(myOrders());
  }, [dispatch, error, toast]);

  if (loading) {
    return (
      <section style={{ paddingBlock: "var(--t-space-3xl)", minHeight: "100vh" }}>
        <div
          style={{
            maxWidth: "var(--t-grid-containerMax)",
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
            textAlign: "center",
            paddingTop: "15vh",
          }}
        >
          <Headline level="2xl">Loading…</Headline>
        </div>
      </section>
    );
  }

  const columns = [
    {
      key: "orderNumber",
      label: "Order Number",
      render: (o) => createOrderNumber(o._id, o.shippingInfo?.country),
    },
    {
      key: "customer",
      label: "Customer",
      muted: true,
      render: () => user?.name || "You",
    },
    {
      key: "items",
      label: "Items",
      muted: true,
      render: (o) => o.orderItems?.length || 0,
    },
    {
      key: "amount",
      label: "Amount",
      render: (o) => (
        <Price style={{ fontSize: "var(--t-fontSize-sm)" }}>
          {fmtInCurrency(o.totalPrice, o.currency, o.currencyRate)}
        </Price>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      muted: true,
      nowrap: true,
      render: (o) => (o.createdAt ? format(parseISO(o.createdAt), "dd.MM.yyyy HH:mm") : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <SeverityPill color={STATUS_VARIANT[o.orderStatus] || "error"}>
          {o.orderStatus}
        </SeverityPill>
      ),
    },
  ];

  return (
    <section
      style={{
        backgroundColor: "var(--t-neutral-50)",
        paddingBlock: "var(--t-space-3xl)",
      }}
    >
      <Seo
        title="Your kept pieces | Hverdag"
        description="Every order, kept on record."
        path="/myorders"
      />
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <Overline style={{ marginBottom: 8 }}>Account</Overline>
        <Headline level="2xl" style={{ marginBottom: 32, fontStyle: "italic" }}>
          Kept pieces
          {ordersCount !== 0 && (
            <span
              style={{
                color: "var(--t-neutral-400)",
                fontWeight: 400,
                marginLeft: 8,
                fontStyle: "normal",
              }}
            >
              ({ordersCount})
            </span>
          )}
        </Headline>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "4rem" }}>
            <BodyText style={{ color: "var(--t-neutral-400)", marginBottom: 24 }}>
              No orders yet.
            </BodyText>
            <PrimaryBtn component={Link} to="/products">
              Browse Collection
            </PrimaryBtn>
          </div>
        ) : (
          <Card>
            <CardBody style={{ padding: 0 }}>
              <Table
                columns={columns}
                rows={sortedRows}
                rowKey={(o) => o._id}
                sortBy={sort.by}
                sortDir={sort.dir}
                onSortChange={(by, dir) => setSort({ by, dir })}
                onRowClick={(o) => navigate(`/order/${o._id}`)}
                emptyMessage="No orders in this view."
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "12px 16px",
                }}
              >
                <Link to="/myorders" style={{ textDecoration: "none" }}>
                  <GhostBtn size="small">View all</GhostBtn>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}

export default MyOrders;
