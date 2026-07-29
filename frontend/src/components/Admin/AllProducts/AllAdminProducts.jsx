import * as React from "react";
import Box from "@mui/material/Box";
import { CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getAdminProducts } from "../../../actions/productAction";
import AllProductsList from "./AllProductsList";
import { useToast } from "../../../hooks/useToast";
import Seo from "../../Seo";

function AllAdminProducts() {
  const dispatch = useDispatch();
  const toast = useToast();

  const { loading, error, products } = useSelector((state) => state.product);

  // Re-fetch every time this page mounts so a freshly created product
  // appears immediately without requiring a manual browser refresh.
  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    dispatch(getAdminProducts());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Error side-effect handled separately so it doesn’t re-trigger the fetch
  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [error, toast, dispatch]);

  // Backend already returns products sorted newest-first, but keep the
  // client-side sort as a safety net in case the order ever changes.
  const sortedProducts = (products || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <Seo
        title="Manage Products - Click.it Dashboard - Admin access only"
        description="Dashboard to manage products and reviews"
        path="/admin/products"
      />
      <Box sx={{ padding: "16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {loading ? (
            <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
              <CircularProgress />
            </div>
          ) : (
            <AllProductsList products={sortedProducts} />
          )}
        </div>
      </Box>
    </>
  );
}

export default AllAdminProducts;
