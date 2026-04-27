import { useState, useMemo } from "react";

/**
 * Shared pagination hook for every admin list page.
 *
 * @param {Array}  items          - The full sorted array coming from Redux.
 * @param {number} defaultPerPage - Rows shown per page on first render (default 10).
 * @returns {{ page, perPage, totalPages, paginated, setPage, setPerPage, PER_PAGE_OPTIONS }}
 */
export const PER_PAGE_OPTIONS = [10, 25, 50];

export default function useAdminPagination(items = [], defaultPerPage = 10) {
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(defaultPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  // Clamp current page whenever the dataset or perPage changes.
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const handleSetPerPage = (value) => {
    setPerPage(value);
    setPage(1); // always reset to first page when page-size changes
  };

  return {
    page: safePage,
    perPage,
    totalPages,
    paginated,
    setPage,
    setPerPage: handleSetPerPage,
    PER_PAGE_OPTIONS,
  };
}
