import React from "react";

/**
 * ImageGrid — vertical thumbnail rail. Plain <button>+<img>, themed.
 * Selected thumb gets primary border + filled bg.
 */
function ImageGrid({ images = [], onSelect, selectedImage = 0 }) {
  if (!images.length) return null;

  return (
    <div
      role="tablist"
      aria-label="Product images"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {images.map((image, index) => {
        const selected = index === selectedImage;
        return (
          <button
            key={image._id || image.public_id || index}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`View image ${index + 1}`}
            onClick={() => onSelect?.(index)}
            style={{
              padding: 0,
              width: 48,
              height: 64,
              flexShrink: 0,
              border: selected
                ? "1.5px solid var(--t-primary-600)"
                : "1px solid var(--t-neutral-200)",
              backgroundColor: selected ? "var(--t-primary-50)" : "var(--t-neutral-50)",
              borderRadius: "var(--t-border-radius-sm)",
              overflow: "hidden",
              cursor: "pointer",
              transition:
                "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out), background-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
            }}
          >
            <img
              src={image.url}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export default ImageGrid;
