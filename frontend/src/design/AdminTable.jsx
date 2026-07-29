// design/AdminTable.jsx
// Shared table primitive for all admin list pages. Wraps the table in a
// horizontally-scrolling div and a sticky <thead>. Use `stickyPage` when the
// table should keep its column headers pinned below the global header + admin
// sub-nav during full-page scroll; otherwise headers only stick within the
// table's own scroll viewport.

import React from "react";
import { Card, CardBody } from "./primitives";

const TABLE_STYLE = {
  width: "100%",
  minWidth: 720,
  borderCollapse: "collapse",
  fontSize: "var(--t-fontSize-sm)",
};

const THEAD_STYLE_BASE = {
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

export default function AdminTable({ children, stickyPage = false }) {
  const theadTop = stickyPage
    ? "calc(var(--t-headerHeight) + 48px)"
    : "0px";
  // If the consumer passed a <thead>, override its sticky offset.
  const enhanced = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === "thead") {
      return React.cloneElement(child, {
        style: {
          ...(child.props.style || {}),
          ...THEAD_STYLE_BASE,
          position: "sticky",
          top: theadTop,
        },
      });
    }
    return child;
  });

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={TABLE_STYLE}>
            {enhanced}
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

AdminTable.thStyle = TH_STYLE;
AdminTable.tdStyle = TD_STYLE;