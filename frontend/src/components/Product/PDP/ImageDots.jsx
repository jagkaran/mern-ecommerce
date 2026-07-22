import React from "react";

function ImageDots({ images = [], selectedImage = 0, onSelect }) {
  if (!images.length) return null;

  return (
    <div
      role="tablist"
      aria-label="Product image pagination"
      className="pdp__dots"
    >
      {images.map((image, index) => {
        const selected = index === selectedImage;
        return (
          <button
            key={image._id || image.public_id || index}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Show image ${index + 1}`}
            onClick={() => onSelect?.(index)}
            className={`pdp__dot ${selected ? "pdp__dot--active" : ""}`.trim()}
          />
        );
      })}
    </div>
  );
}

export default ImageDots;