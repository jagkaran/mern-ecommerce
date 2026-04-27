import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  MenuItem,
  Pagination,
  Rating,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { clearErrors, deleteProduct } from "../../../actions/productAction";
import { useEffect, useState } from "react";
import { useAlert } from "react-alert";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";

function AllProductsList({ products }) {
  const dispatch = useDispatch();
  const history  = useNavigate();
  const alert    = useAlert();

  const [open, setOpen]                   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});

  const { page, perPage, totalPages, paginated, setPage, setPerPage } =
    useAdminPagination(products, 10);

  const handleClickOpen = (product) => { setOpen(true); setSelectedProduct(product); };
  const handleClose     = () => setOpen(false);

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

  return (
    <Card>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CardHeader
        title={`All Products (${products.length})`}
        action={
          <Button
            endIcon={<AddIcon fontSize="small" />}
            size="small"
            href="/admin/product/new"
          >
            Create Product
          </Button>
        }
      />
      <Divider />

      {/* ── Table ──────────────────────────────────────────────────── */}
      <PerfectScrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Ratings</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((product) => (
                <TableRow hover key={product._id}>
                  <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    {product._id}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Rating
                      name="half-rating-read"
                      value={product.ratings}
                      precision={0.5}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <Link to={`/admin/product/update/${product._id}`}>
                      <EditIcon />
                    </Link>
                    <Button onClick={() => handleClickOpen(product)}>
                      <DeleteIcon />
                    </Button>

                    {/* Confirm dialog — rendered once outside the map would be
                        cleaner, but keeping it here avoids prop-drilling */}
                    <Dialog
                      open={open && selectedProduct._id === product._id}
                      onClose={handleClose}
                      aria-labelledby="prod-delete-title"
                    >
                      <DialogTitle id="prod-delete-title">Delete Confirmation</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          Are you sure you want to delete "{selectedProduct.name}"?
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClose} color="primary">Cancel</Button>
                        <Button
                          onClick={() => deleteProductHandler(selectedProduct._id)}
                          color="secondary"
                        >
                          Delete
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>

      <Divider />

      {/* ── Pagination footer ──────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 2, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <Select
            size="small"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            sx={{ fontSize: "0.875rem" }}
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {Math.min((page - 1) * perPage + 1, products.length)}–
            {Math.min(page * perPage, products.length)} of {products.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            size="small"
          />
        </Stack>
      </Stack>
    </Card>
  );
}

export default AllProductsList;
