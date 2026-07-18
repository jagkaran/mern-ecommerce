import React from "react";
import { Link } from "react-router-dom";

export default function Manifesto() {
  return (
    <section
      style={{
        backgroundColor: "var(--t-neutral-100)",
        paddingBlock: "var(--t-space-4xl)",
        paddingInline: "var(--t-grid-containerPad)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--t-measure-base)",
          marginInline: "auto",
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: "var(--t-fontSize-xs)",
            fontWeight: 500,
            letterSpacing: "var(--t-letterSpacing-widest)",
            textTransform: "uppercase",
            color: "var(--t-neutral-500)",
            marginBottom: "var(--t-space-md)",
          }}
        >
          Our keeper's covenant
        </span>
        <h2
          style={{
            fontFamily: "var(--t-fontFamily-display)",
            fontSize: "var(--t-fontSize-4xl)",
            fontWeight: 500,
            color: "var(--t-neutral-900)",
            lineHeight: 1.25,
            letterSpacing: "var(--t-letterSpacing-tight)",
            marginBottom: "var(--t-space-lg)",
          }}
        >
          We mend what we sell. We sharpen what dulls. We reglaze what chips.
        </h2>
        <p
          style={{
            color: "var(--t-neutral-700)",
            fontSize: "var(--t-fontSize-base)",
            lineHeight: 1.7,
            marginBottom: "var(--t-space-lg)",
          }}
        >
          Every object we carry is one we'd feel comfortable handing down — and every one of them
          comes with a lifetime of care. When the linen frays, we restitch it. When the bowl loses
          its glaze, we reapply it. When the knife goes blunt, we resharpen it. Forever.
        </p>
        <p
          style={{
            color: "var(--t-neutral-600)",
            fontSize: "var(--t-fontSize-base)",
            fontFamily: "var(--t-fontFamily-display)",
            fontStyle: "italic",
            lineHeight: 1.6,
            marginBottom: "var(--t-space-lg)",
          }}
        >
          Patina is celebrated, not hidden.
        </p>
        <Link
          to="/aboutus"
          style={{
            display: "inline-block",
            color: "var(--t-primary-600)",
            textDecoration: "none",
            borderBottom: "1px solid var(--t-primary-300)",
            paddingBottom: "2px",
            fontSize: "var(--t-fontSize-sm)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            transition: "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
          }}
        >
          Read our covenant
        </Link>
      </div>
    </section>
  );
}
