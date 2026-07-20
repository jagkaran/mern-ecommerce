import React from "react";
import { Rating } from "@mui/material";
import { avatarUrl } from "../utils/avatar";

function formatReviewDate(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const StarShield = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    style={{
      position: "absolute",
      top: -2,
      right: -2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: "var(--t-accent-sage-400)",
      fill: "#fff",
    }}
    aria-hidden
  >
    <path d="M19 11a7.5 7.5 0 0 1-3.5 5.94L10 20l-5.5-3.06A7.5 7.5 0 0 1 1 11V3c3.38 0 6.5-1.12 9-3 2.5 1.89 5.62 3 9 3v8zm-9 1.08l2.92 2.04-1.03-3.41 2.84-2.15-3.56-.08L10 5.12 8.83 8.48l-3.56.08L8.1 10.7l-1.03 3.4L10 12.09z" />
  </svg>
);

export default function Reviewcard({ name, rating, comment, profileImg, createdAt }) {
  const dateLabel = formatReviewDate(createdAt);
  const avatarSrc = profileImg || avatarUrl({ name, profilePic: { url: "" } });

  return (
    <article
      style={{
        display: "flex",
        gap: 16,
        padding: "1.25rem 0",
        borderTop: "1px solid var(--t-neutral-200)",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          alt={name}
          src={avatarSrc}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            objectFit: "cover",
            background: "var(--t-neutral-100)",
            display: "block",
          }}
        />
        <StarShield size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              color: "var(--t-neutral-900)",
              fontWeight: 500,
              fontSize: "var(--t-fontSize-base)",
            }}
          >
            {name}
          </span>
          {dateLabel && (
            <span
              style={{
                color: "var(--t-neutral-500)",
                fontSize: "var(--t-fontSize-sm)",
              }}
            >
              {dateLabel}
            </span>
          )}
        </div>
        <Rating value={rating} precision={0.5} readOnly size="small" sx={{ mb: 1 }} />
        <p
          style={{
            color: "var(--t-neutral-700)",
            fontSize: "var(--t-fontSize-base)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {comment}
        </p>
      </div>
    </article>
  );
}
