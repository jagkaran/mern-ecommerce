import React, { useState, useEffect } from "react";
import { Rating } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { clearErrors, deleteProduct } from "../../../actions/productAction";
import { useCurrency } from "../../../utils/currencyContext";
import { useAlert } from "react-alert";
import { Card, CardBody, Overline, Headline, BodyText, GhostBtn } from "../../../design/primitives";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";

function AllProductsList({ products }) {
  const dispatch = useDispatch();
  const history = useNavigate();
  const alert = useAlert();
  const { fmt } = useCurrency();

  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});

  const { page, perPage, totalPages, paginated, setPage, setPerPage } =
    useAdminPagination(products, 10);

  const handleClickOpen = (product) => {
    setOpen(true);
    setSelectedProduct(product);
  };
  const handleClose = () => setOpen(false);

  const { error: deleteError, isDeleted } = useSelector(
    (state) => state.modifiedProduct
  );

  const deleteProductHandler = (id) => {
    dispatch(deleteProduct(id));
    setOpen(false);
  };

  useEffect(() => {
    if (deleteError) {
      alert.error(deleteError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      alert.success("Product Deleted Successfully");
      history("/admin/products");
      dispatch({ type: "DeleteProductReset" });
    }
  }, [dispatch, alert, deleteError, history, isDeleted]);

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardBody>
          <BodyText style={{ color: "var(--t-neutral-400)" }}>
            No products found.
          </BodyText>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--t-neutral-200)",
          }}
        >
          <Overline>All Products</Overline>
          <GhostBtn
            component={Link}
            to="/admin/product/new"
            size="small"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <AddIcon fontSize="small" /> New
          </GhostBtn>
        </div>

        <div style={{ overflowX: "auto" }}>
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
                }}
              >
                {["Product ID", "Name", "Ratings", "Stock", "Price", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--t-neutral-500)",
                        fontSize: "var(--t-fontSize-xs)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => (
                <tr
                  key={product._id}
                  style={{
                    borderBottom: "1px solid var(--t-neutral-100)",
                    transition: "background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--t-neutral-50)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                      color: "var(--t-neutral-500)",
                    }}
                  >
                    {product._id}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {product.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Rating
                      value={product.ratings}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--t-neutral-600)",
                    }}
                  >
                    {product.stock}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--t-neutral-600)",
                    }}
                  >
                    {fmt(product.price)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Link
                        to={`/admin/product/update/${product._id}`}
                        style={{
                          color: "var(--t-neutral-500)",
                          textDecoration: "none",
                          transition: "color 150ms",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--t-primary-600)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--t-neutral-500)")
                        }
                      >
                        ✎
                      </Link>
                      <GhostBtn
                        size="small"
                        onClick={() => handleClickOpen(product)}
                        style={{ color: "var(--t-neutral-400)" }}
                      >
                        ✕
                      </GhostBtn>

                      {open && selectedProduct._id === product._id && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1300,
                          }}
                          onClick={handleClose}
                        >
                          <div
                            style={{
                              background: "var(--t-neutral-50)",
                              borderRadius: "var(--t-border-radius-base)",
                              padding: 24,
                              maxWidth: 400,
                              width: "90%",
                              boxShadow: "var(--t-shadow-lg)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Headline
                              level="lg"
                              style={{ marginBottom: 12 }}
                            >
                              Delete Confirmation
                            </Headline>
                            <BodyText
                              style={{
                                color: "var(--t-neutral-500)",
                                marginBottom: 20,
                              }}
                            >
                              Are you sure you want to delete &ldquo;
                              {selectedProduct.name}&rdquo;?
                            </BodyText>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                              }}
                            >
                              <GhostBtn size="small" onClick={handleClose}>
                                Cancel
                              </GhostBtn>
                              <GhostBtn
                                size="small"
                                onClick={() =>
                                  deleteProductHandler(selectedProduct._id)
                                }
                                style={{
                                  color: "var(--t-semantic-error)",
                                  borderColor: "var(--t-semantic-error)",
                                }}
                              >
                                Delete
                              </GhostBtn>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "1px solid var(--t-neutral-200)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              Rows per page:
            </BodyText>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={{
                fontSize: "0.875rem",
                border: "1px solid var(--t-neutral-300)",
                borderRadius: "var(--t-border-radius-base)",
                padding: "2px 8px",
                background: "var(--t-neutral-50)",
                color: "var(--t-neutral-700)",
              }}
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              {Math.min((page - 1) * perPage + 1, products.length)}–
              {Math.min(page * perPage, products.length)} of {products.length}
            </BodyText>
            <div style={{ display: "flex", gap: 4 }}>
              <GhostBtn
                size="small"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                ‹
              </GhostBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <GhostBtn
                    key={p}
                    size="small"
                    onClick={() => setPage(p)}
                    style={{
                      background:
                        p === page
                          ? "var(--t-primary-600)"
                          : "transparent",
                      color: p === page ? "#fff" : "var(--t-neutral-700)",
                      borderColor:
                        p === page
                          ? "var(--t-primary-600)"
                          : "var(--t-neutral-300)",
                    }}
                  >
                    {p}
                  </GhostBtn>
                )
              )}
              <GhostBtn
                size="small"
                onClick={() =>
                  setPage(Math.min(totalPages, page + 1))
                }
                disabled={page >= totalPages}
              >
                ›
              </GhostBtn>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default AllProductsList;
