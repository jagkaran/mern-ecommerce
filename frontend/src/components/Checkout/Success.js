import React from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { ThanksBlock, SpoonIllustration, Surface, Price, PrimaryBtn, GhostBtn, Divider } from "../../design/primitives";
import { fmtInCurrency } from "../../utils/fmtInCurrency";
import ClaimForm from "./ClaimForm";

export default function Success() {
  const { order } = useSelector((state) => state.newOrder);
  const { user } = useSelector((state) => state.user);
  const [params] = useSearchParams();
  const token = params.get("token");
  const orderId = order?._id;
  const orderTotal = order?.totalPrice || order?.itemsPrice || null;
  const currency = order?.currency || "USD";
  const rate = order?.currencyRate || 1;

  if (!orderId) {
    return (
      <section style={{ paddingBlock: "var(--t-space-4xl)" }}>
        <div
          style={{
            maxWidth: "var(--t-grid-containerMax)",
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--t-neutral-500)", fontFamily: "var(--t-fontFamily-display)", fontStyle: "italic" }}>
            gathering the details…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        paddingBlock: "var(--t-space-4xl)",
        backgroundColor: "var(--t-neutral-50)",
        minHeight: "70vh",
      }}
    >
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <ThanksBlock
          title="thank you — we've got this"
          subtitle="Your order is being looked after. We'll send a quiet note when it leaves the workshop, and another when it's safely with you."
          orderRef={orderId.slice(-8)}
          illustration={<SpoonIllustration size={120} />}
        />

        {orderTotal && (
          <Surface
            sx={{
              maxWidth: 480,
              mx: "auto",
              mt: 2,
              p: { xs: 3, sm: 4 },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "var(--t-fontSize-sm)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--t-neutral-500)",
                }}
              >
                Total
              </span>
              <Price large>{fmtInCurrency(orderTotal, currency, rate)}</Price>
            </div>
            <Divider style={{ marginBlock: "1rem", background: "var(--t-neutral-200)" }} />
            <p
              style={{
                fontSize: "var(--t-fontSize-sm)",
                color: "var(--t-neutral-500)",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              free mending for life, included
            </p>
          </Surface>
        )}

        {token && !user && (
          <Surface
            sx={{
              maxWidth: 480,
              mx: "auto",
              mt: 3,
              p: { xs: 3, sm: 4 },
            }}
          >
            <ClaimForm claimToken={token} />
          </Surface>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "2.5rem",
          }}
        >
          <Link to={`/order/${orderId}`} style={{ textDecoration: "none" }}>
            <PrimaryBtn>View order</PrimaryBtn>
          </Link>
          <Link to="/products" style={{ textDecoration: "none" }}>
            <GhostBtn>Browse more</GhostBtn>
          </Link>
        </div>
      </div>
    </section>
  );
}