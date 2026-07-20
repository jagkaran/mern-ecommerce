import React from "react";
import { cld, srcset } from "../../../utils/cloudinary";

/**
 * MainImage — primary PDP image. Plain <img>, 1:1 fluid, object-fit cover.
 * Aspect-ratio reserved to prevent CLS while loading.
 */
function MainImage({ src, alt }) {
  if (!src) {
    return (
      <div
        aria-hidden
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          backgroundColor: "var(--t-neutral-100)",
          color: "var(--t-neutral-400)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--t-fontSize-sm)",
          borderRadius: "var(--t-border-radius-base)",
        }}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={cld(src, { w: 1200 })}
      srcSet={srcset(src)}
      sizes="(max-width:768px) 100vw, 50vw"
      alt={alt || "Product image"}
      loading="eager"
      fetchpriority="high"
      decoding="async"
      className="pdp__main-image"
      style={{
        display: "block",
        width: "100%",
        aspectRatio: "1 / 1",
        objectFit: "cover",
        backgroundColor: "var(--t-neutral-100)",
        borderRadius: "var(--t-border-radius-base)",
      }}
    />
  );
}

export default MainImage;
