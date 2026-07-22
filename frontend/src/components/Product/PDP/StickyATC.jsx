import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { QtyStepper, Headline } from "../../../design/primitives";
import { useCurrency } from "../../../utils/currencyContext";

const css = `
.pdp__sticky-atc {
  display: none;
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 1000;
  background: var(--t-neutral-50);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  padding: 12px 16px;
  padding-block-end: calc(12px + env(safe-area-inset-bottom));
  align-items: center;
  gap: 12px;
}
.pdp__sticky-atc--visible { display: flex; }
@media (min-width: 901px) {
  .pdp__sticky-atc { display: none !important; }
}
.pdp__sticky-price { font-family: var(--t-fontFamily-display); color: var(--t-neutral-900); margin-right: auto; }
`;

function StickyATC({
  price,
  quantity,
  setQuantity,
  increaseQty,
  decreaseQty,
  addToCartHandler,
  stock,
  visible,
}) {
  const { fmt } = useCurrency();
  const [mqMobile, setMqMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setMqMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!mqMobile || !(stock > 0) || !visible) return null;

  return (
    <>
      <style>{css}</style>
      <div className="pdp__sticky-atc pdp__sticky-atc--visible" role="region" aria-label="Add to cart">
        <Headline level="2xl" sx={{ fontFamily: "var(--t-fontFamily-display)" }} className="pdp__sticky-price">
          {fmt(price)}
        </Headline>
        <QtyStepper
          value={quantity}
          min={1}
          max={stock || 99}
          onChange={setQuantity}
          ariaLabel="Quantity"
        />
        <Button
          variant="contained"
          size="large"
          startIcon={<AddShoppingCartIcon />}
          onClick={() => addToCartHandler(quantity)}
          sx={{
            backgroundColor: "var(--t-primary-700)",
            color: "var(--t-neutral-50)",
            borderRadius: "var(--t-border-radius-base)",
            py: 1.5,
            minHeight: 44,
            fontFamily: "var(--t-fontFamily-body)",
            textTransform: "none",
            "&:hover": { backgroundColor: "var(--t-primary-800)" },
            "&.Mui-disabled": {
              backgroundColor: "var(--t-neutral-200)",
              color: "var(--t-neutral-500)",
            },
          }}
        >
          Add to Cart
        </Button>
      </div>
    </>
  );
}

export default StickyATC;
