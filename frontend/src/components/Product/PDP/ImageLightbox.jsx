import React, { useEffect, useRef, useState } from "react";
import { cld } from "../../../utils/cloudinary";

const css = `
.pdp__lightbox {
  width: min(95vw, 1200px);
  height: min(90vh, 900px);
  max-width: none;
  max-height: none;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--t-neutral-50);
  overflow: hidden;
}
.pdp__lightbox::backdrop { background: rgba(0, 0, 0, 0.92); }
.pdp__lightbox-inner { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
.pdp__lightbox img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  touch-action: pinch-zoom;
  user-select: none;
  -webkit-user-drag: none;
}
.pdp__lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.pdp__lightbox-close:hover { background: rgba(0, 0, 0, 0.85); }
.pdp__lightbox-counter {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--t-fontFamily-body);
  font-size: var(--t-fontSize-sm);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
}
`;

const clampIndex = (index, length) => Math.max(0, Math.min(index, length - 1));

function ImageLightbox({ images = [], open, onClose, initialIndex = 0, alt = "" }) {
  const dialogRef = useRef(null);
  const touchStartXRef = useRef(null);
  const [index, setIndex] = useState(() => clampIndex(initialIndex, images.length));

  useEffect(() => {
    setIndex(clampIndex(initialIndex, images.length));
  }, [initialIndex, open, images.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.hasAttribute("open")) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    }

    return () => {
      if (!dialog.hasAttribute("open")) return;
      try {
        dialog.close();
      } catch {
        dialog.removeAttribute("open");
      }
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const handleCancel = (event) => {
      event.preventDefault();
      onClose?.();
    };
    const handleBackdropClick = (event) => {
      if (event.target === dialog) onClose?.();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleBackdropClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  if (!open || !images.length) return null;

  const image = images[index];

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX == null || endX == null) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) <= 60) return;

    setIndex((currentIndex) => clampIndex(currentIndex + (deltaX < 0 ? 1 : -1), images.length));
  };

  return (
    <>
      <style>{css}</style>
      <dialog
        ref={dialogRef}
        className="pdp__lightbox"
        aria-label={`Image ${index + 1} of ${images.length}`}
      >
        <div
          className="pdp__lightbox-inner"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="pdp__lightbox-close"
            aria-label="Close image viewer"
            onClick={() => onClose?.()}
          >
            ×
          </button>
          <img src={cld(image.url, { w: 1600 })} alt={alt} draggable={false} />
          <div className="pdp__lightbox-counter" aria-live="polite">
            {index + 1} / {images.length}
          </div>
        </div>
      </dialog>
    </>
  );
}

export default ImageLightbox;
