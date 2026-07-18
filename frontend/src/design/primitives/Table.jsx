import React from "react";

/**
 * Table — themed, sortable, quiet. Use when 4+ columns of comparable rows.
 * Not for layout — that's CSS grid.
 *
 * <Table
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'count', label: 'Items', sortable: false },
 *     ...
 *   ]}
 *   rows={rows}
 *   rowKey={(r) => r._id}
 *   onRowClick={(r) => ...}
 *   emptyMessage="No orders yet."
 * />
 */
function Table({
  columns = [],
  rows = [],
  rowKey,
  onRowClick,
  emptyMessage = "Nothing here yet.",
  sortBy,
  sortDir = "asc",
  onSortChange,
  sx,
}) {
  const empty = !rows || rows.length === 0;

  return (
    <div
      role="region"
      aria-label="Data table"
      style={{
        overflowX: "auto",
        ...sx,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--t-fontSize-sm)",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--t-neutral-200)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              backgroundColor: "var(--t-neutral-50)",
            }}
          >
            {columns.map((col) => {
              const sortable = !!col.sortable || !!col.onSort;
              const isSorted = sortBy === col.key;
              const nextDir = isSorted && sortDir === "asc" ? "desc" : "asc";
              const ariaSort = !isSorted ? "none" : sortDir === "asc" ? "ascending" : "descending";
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortable ? ariaSort : undefined}
                  onClick={
                    sortable
                      ? () => (col.onSort ? col.onSort(nextDir) : onSortChange?.(col.key, nextDir))
                      : undefined
                  }
                  style={{
                    padding: "12px 16px",
                    textAlign: col.align || "left",
                    fontWeight: 600,
                    color: "var(--t-neutral-500)",
                    fontSize: "var(--t-fontSize-xs)",
                    whiteSpace: "nowrap",
                    cursor: sortable ? "pointer" : "default",
                    userSelect: sortable ? "none" : undefined,
                    transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                  }}
                >
                  {col.label}
                  {sortable && (
                    <span
                      style={{
                        marginLeft: 6,
                        opacity: isSorted ? 1 : 0.35,
                        color: isSorted ? "var(--t-primary-600)" : "var(--t-neutral-500)",
                      }}
                    >
                      {isSorted && sortDir === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--t-neutral-400)",
                  fontStyle: "italic",
                  fontFamily: "var(--t-fontFamily-display)",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey ? rowKey(row) : row._id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  borderBottom: "1px solid var(--t-neutral-100)",
                  transition:
                    "background-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = "var(--t-neutral-50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      textAlign: col.align || "left",
                      color: col.muted ? "var(--t-neutral-600)" : "var(--t-neutral-900)",
                      fontWeight: col.bold ? 600 : 400,
                      whiteSpace: col.nowrap ? "nowrap" : undefined,
                    }}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
export { Table };
