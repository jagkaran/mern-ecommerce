import React from "react";
import { Link } from "react-router-dom";
import { Tile, TileMedia, TileBody } from "../../design/primitives";
import { motion } from "motion/react";

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const tile = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * CategoryGrid — auto-fits columns to category count.
 * 1 cat → 1 col, 2 → 2, 3 → 3, ≥4 → 4.
 */
export default function CategoryGrid({ products }) {
  const cats = [...new Set(products.map((p) => p.category))];
  const cols = Math.min(4, cats.length);

  return (
    <section
      style={{
        paddingBlock: "var(--t-space-4xl)",
        paddingInline: "var(--t-grid-containerPad)",
        backgroundColor: "var(--t-neutral-50)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "var(--t-space-xl)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontSize: "var(--t-fontSize-xs)",
                fontWeight: 500,
                letterSpacing: "var(--t-letterSpacing-widest)",
                textTransform: "uppercase",
                color: "var(--t-neutral-500)",
                marginBottom: "var(--t-space-sm)",
              }}
            >
              Browse
            </span>
            <h2
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                color: "var(--t-neutral-900)",
                lineHeight: 1.2,
                letterSpacing: "var(--t-letterSpacing-tight)",
                margin: 0,
              }}
            >
              The everyday, organized.
            </h2>
          </div>
          <Link
            to="/products"
            style={{
              color: "var(--t-primary-600)",
              textDecoration: "none",
              fontSize: "var(--t-fontSize-sm)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              borderBottom: "1px solid var(--t-primary-300)",
              paddingBottom: 2,
            }}
          >
            See all {cats.length} shelves →
          </Link>
        </div>

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "var(--t-grid-gutter)",
          }}
        >
          {cats.map((cat) => {
            const img = products.find((p) => p.category === cat)?.images?.[0]?.url;
            const count = products.filter((p) => p.category === cat).length;
            return (
              <motion.div key={cat} variants={tile}>
                <Tile to={`/products?category=${encodeURIComponent(cat)}`}>
                  <TileMedia ratio={cols === 1 ? "21/9" : "4/5"}>
                    {img ? (
                      <img
                        src={img}
                        alt={cat}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--t-fontFamily-display)",
                          fontSize: "4rem",
                          color: "var(--t-neutral-300)",
                        }}
                      >
                        {cat?.[0] || "?"}
                      </span>
                    )}
                  </TileMedia>
                  <TileBody>
                    <span
                      style={{
                        fontSize: "var(--t-fontSize-xs)",
                        fontWeight: 500,
                        letterSpacing: "var(--t-letterSpacing-widest)",
                        textTransform: "uppercase",
                        color: "var(--t-neutral-500)",
                      }}
                    >
                      {cat}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--t-fontSize-xl)",
                        fontFamily: "var(--t-fontFamily-display)",
                        fontWeight: 500,
                        color: "var(--t-neutral-900)",
                        letterSpacing: "var(--t-letterSpacing-tight)",
                      }}
                    >
                      {count} {count === 1 ? "piece" : "pieces"}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--t-fontSize-sm)",
                        color: "var(--t-neutral-500)",
                      }}
                    >
                      Browse →
                    </span>
                  </TileBody>
                </Tile>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
