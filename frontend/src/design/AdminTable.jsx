// design/AdminTable.jsx
// Shared table primitive for all admin list pages.
//
// Layout (top → bottom inside the Card):
//   1. Header row: title (Overline) on the left, optional action button + count on the right
//   2. <thead> rendered as the first row of the table — sticks to the top of the scroll wrapper
//      so column headers stay visible while scrolling vertically through long lists.
//   3. <tbody> + <tfoot> supplied by the caller.
//
// The sticky thead pins to the top of the inner scroll wrapper, not to the page header, so it
// never overlaps the admin sub-nav or the header row. `overflow: auto` on the inner wrapper
// (rather than just `overflow-x: auto`) is what activates the sticky behaviour.

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Overline } from "./primitives";

const TABLE_STYLE = {
  width: "100%",
  minWidth: 720,
  borderCollapse: "collapse",
  fontSize: "var(--t-fontSize-sm)",
};

const THEAD_BASE = {
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "var(--t-neutral-50)",
  zIndex: 1,
};

const TH_STYLE = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 600,
  color: "var(--t-neutral-500)",
  fontSize: "var(--t-fontSize-xs)",
  whiteSpace: "nowrap",
};

const TD_STYLE = { padding: "12px 16px" };

const HEADER_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 24px",
  borderBottom: "1px solid var(--t-neutral-200)",
  flexWrap: "wrap",
};

const COUNT_STYLE = {
  fontSize: "var(--t-fontSize-xl)",
  fontWeight: 600,
  color: "var(--t-neutral-900)",
  margin: 0,
  fontVariantNumeric: "tabular-nums",
};

const ACTION_BTN_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  borderRadius: 999,
  background: "var(--t-primary-600)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  border: "1px solid var(--t-primary-600)",
  transition: "background-color 150ms cubic-bezier(0, 0, 0.2, 1)",
};

function HeaderRow({ title, count, action }) {
  const hasCount = typeof count === "number";
  return (
    <div style={HEADER_ROW_STYLE}>
      <Overline>{title}</Overline>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {hasCount && <p style={COUNT_STYLE}>{count}</p>}
        {action && (
          <Link
            to={action.to}
            style={ACTION_BTN_STYLE}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-primary-700)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--t-primary-600)")}
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AdminTable({
  title,
  count,
  action,
  children,
}) {
  // The consumer passes <thead>, <tbody>, and <tfoot> directly. We render the
  // header row + scroll wrapper + table. Stickiness is applied to the inner
  // <thead> so it pins to the top of the scroll wrapper as the body scrolls.
  let thead = null;
  const body = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === "thead") {
      thead = React.cloneElement(child, {
        style: {
          ...(child.props.style || {}),
          ...THEAD_BASE,
          position: "sticky",
          top: 0,
        },
      });
      return null; // rendered explicitly below inside the scroll wrapper
    }
    return child;
  });

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        {(title || typeof count === "number" || action) && (
          <HeaderRow title={title} count={count} action={action} />
        )}

        <div style={{ overflow: "auto", maxHeight: "min(70vh, 720px)" }}>
          <table style={TABLE_STYLE}>
            {thead}
            {body}
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

AdminTable.thStyle = TH_STYLE;
AdminTable.tdStyle = TD_STYLE;
AdminTable.headerRowStyle = HEADER_ROW_STYLE;