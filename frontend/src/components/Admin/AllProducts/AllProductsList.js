import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Box,
  Button,
  Card,
  CardHeader,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { clearErrors, deleteProduct } from "../../../actions/productAction";
import { useEffect } from "react";
import { useAlert } from "react-alert";

function AllProductsList({ products }) {
  const dispatch = useDispatch();
  const history = useNavigate();
  const alert = useAlert();

  const { error: deleteError, isDeleted } = useSelector(
    (state) => state.modifiedProduct
  );

  const deleteProductHandler = (id) => {
    dispatch(deleteProduct(id));
  };

  useEffect(() => {
    if (deleteError) {
      alert.error(deleteError);
      dispatch(clearErrors());
    }

    if (isDeleted) {
      alert.success("Product Deleted Successfully");
      history("/dashboard");
      dispatch({ type: "DeleteProductReset" });
    }
  }, [dispatch, alert, deleteError, history, isDeleted]);

  return (
    <Card>
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
              {products.map((product) => (
                <TableRow hover key={product._id}>
                  <TableCell>{product._id}</TableCell>
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
                    {" "}
                    <Link to={`/admin/product/update/${product._id}`}>
                      <EditIcon />
                    </Link>
                    <Button onClick={() => deleteProductHandler(product._id)}>
                      <DeleteIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
    </Card>
  );
}

export default AllProductsList;
