import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import ProductCard from "../Product/ProductCard";

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const card = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ProductSection({ title, overline, products, linkTo, linkLabel }) {
  const items = products.slice(0, 8);
  return (
    <section style={{ paddingBlock: "var(--t-space-2xl)" }}>
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "32px",
          }}
        >
          <div>
            {overline && (
              <span
                style={{
                  display: "block",
                  fontSize: "var(--t-fontSize-xs)",
                  fontWeight: 500,
                  letterSpacing: "var(--t-letterSpacing-wider)",
                  textTransform: "uppercase",
                  color: "var(--t-neutral-400)",
                  marginBottom: "var(--t-space-sm)",
                }}
              >
                {overline}
              </span>
            )}
            <h2
              style={{
                fontSize: "var(--t-fontSize-3xl)",
                fontWeight: 700,
                color: "var(--t-neutral-900)",
                lineHeight: "var(--t-lineHeight-snug)",
              }}
            >
              {title}
            </h2>
          </div>
          {linkTo && (
            <Link
              to={linkTo}
              style={{
                color: "var(--t-primary-600)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
            >
              {linkLabel || "All"}
            </Link>
          )}
        </div>

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
          className="prod-grid"
          style={{ display: "grid", gap: "24px" }}
        >
          {items.map((p, i) => (
            <motion.div key={p._id} variants={card}>
              <ProductCard {...p} isNew={i < 3} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
