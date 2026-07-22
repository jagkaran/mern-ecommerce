import React, { useCallback } from "react";
import { cld, srcset } from "../../../utils/cloudinary";

const hoverCss = `
.pdp__main-image { transition: transform var(--t-motion-duration-fast) var(--t-motion-easing-out); cursor: zoom-in; }
@media (min-width: 900px) {
  .pdp__main-image:hover { cursor: zoom-in; }
  .pdp__main-image--zooming { transform: scale(1.8); transition: none; }
}
`;

function MainImage({ src, alt, onOpen }) {
  const onMove = useCallback((e) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.setProperty("--zx", `${x}%`);
    img.style.setProperty("--zy", `${y}%`);
    img.style.transformOrigin = `${x}% ${y}%`;
    img.classList.add("pdp__main-image--zooming");
  }, []);

  const onLeave = useCallback((e) => {
    e.currentTarget.classList.remove("pdp__main-image--zooming");
    e.currentTarget.style.transformOrigin = "";
  }, []);

  const onClick = useCallback(() => {
    onOpen?.();
  }, [onOpen]);

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
    <>
      <style>{hoverCss}</style>
      <img
        src={cld(src, { w: 1200 })}
        srcSet={srcset(src)}
        sizes="(max-width:768px) 100vw, 50vw"
        alt={alt || "Product image"}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        className="pdp__main-image"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "1 / 1",
          objectFit: "cover",
          backgroundColor: "var(--t-neutral-100)",
          borderRadius: "var(--t-border-radius-base)",
        }}
      />
    </>
  );
}

export default MainImage;
