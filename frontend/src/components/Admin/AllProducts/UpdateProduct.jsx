import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import {
  clearErrors,
  deleteReview,
  getAllReviews,
  getProductDetails,
  updateProduct,
} from "../../../actions/productAction";
import { useToast } from "../../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import CategoryIcon from "@mui/icons-material/Category";
import { useFormControls } from "../Hooks/useFormControl";
import UpdateReviews from "./UpdateReviews";
import Seo from "../../Seo";

function UpdateProduct() {
  const { id } = useParams();

  const dispatch = useDispatch();
  const toast = useToast();

  const { loading, error: updateError, isUpdated } = useSelector((state) => state.modifiedProduct);
  const { error, product } = useSelector((state) => state.productDetails);
  const { error: deleteReviewError, isDeleted } = useSelector((state) => state.review);
  const { error: allReviewsError, reviews } = useSelector((state) => state.allReviews);

  const [images, setImages] = useState([]);
  const [oldImages, setOldImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);
  const history = useNavigate();

  const { handleInputValue, formIsValid, errors, values, setValues } = useFormControls();

  const categories = [
    { id: 1, name: "laptop" },
    { id: 2, name: "footwear" },
    { id: 3, name: "bottom" },
    { id: 4, name: "clothing" },
    { id: 5, name: "tops" },
    { id: 6, name: "shoes" },
    { id: 7, name: "camera" },
    { id: 8, name: "smartphones" },
    { id: 9, name: "accessories" },
  ];

  const updateProductSubmitHandler = (e) => {
    e.preventDefault();
    if (formIsValid()) {
      const myForm = new FormData();
      myForm.set("name", values.name);
      myForm.set("price", values.price);
      myForm.set("description", values.description);
      myForm.set("category", values.category);
      myForm.set("stock", values.stock);
      images.forEach((image) => myForm.append("images", image));
      dispatch(updateProduct(id, myForm));
    }
  };

  const updateProductImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([]);
    setImagesPreview([]);
    setOldImages([]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview((old) => [...old, reader.result]);
          setImages((old) => [...old, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteReviewHandler = (reviewId) => {
    dispatch(deleteReview(reviewId, id));
  };

  // setValues is a stable setter from useFormControls —
  // Populate form when product record arrives (or id changes).
  // Re-fetch only when the loaded record doesn't match the route id — never on
  // error/toast changes (those live in the effect below, separate).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (product && product._id === id) {
      setValues({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category || "",
        stock: product.stock || "",
      });
      setOldImages(product.images);
    } else {
      dispatch(getProductDetails(id));
      dispatch(getAllReviews(id));
    }
  }, [dispatch, id, product]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (updateError) {
      toast.error(updateError);
      dispatch(clearErrors());
    }
    if (allReviewsError) {
      toast.error(allReviewsError);
      dispatch(clearErrors());
    }
    if (deleteReviewError) {
      toast.error(deleteReviewError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      toast.success("Review Deleted Successfully");
      history("/admin/products");
      dispatch({ type: "DeleteReviewReset" });
    }
    if (isUpdated) {
      toast.success("Product Updated Successfully");
      history("/admin/products");
      dispatch({ type: "UpdateProductReset" });
    }
  }, [
    dispatch,
    error,
    toast,
    history,
    isUpdated,
    updateError,
    allReviewsError,
    deleteReviewError,
    isDeleted,
  ]);

  return (
    <div style={{ padding: "24px 16px" }}>
      <Seo
        title="Update Product Details - Click.it Dashboard - Admin access only"
        description="Dashboard panel to manage available products on Click.it store"
        path="/admin/product/update"
      />
      <Box
        sx={{
          maxWidth: "720px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "var(--t-border-radius-base)",
          padding: { xs: "20px", md: "32px" },
          boxShadow: "var(--t-shadow-sm)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: "24px" }}>
          <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}>
            <CategoryIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Update Product
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" noValidate onSubmit={updateProductSubmitHandler}>
            <TextField
              required
              fullWidth
              name="name"
              id="name"
              label="Product Name"
              autoFocus
              value={values.name}
              onChange={handleInputValue}
              sx={{ marginBottom: "16px" }}
              {...(errors.name && { error: true, helperText: errors.name })}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <TextField
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                id="price"
                label="Price"
                name="price"
                type="number"
                value={values.price}
                onChange={handleInputValue}
                {...(errors.price && { error: true, helperText: errors.price })}
              />
              <TextField
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                name="stock"
                label="Stock"
                id="stock"
                value={values.stock}
                onChange={handleInputValue}
                {...(errors.stock && { error: true, helperText: errors.stock })}
              />
            </Box>

            <TextField
              required
              fullWidth
              name="description"
              label="Description"
              id="description"
              multiline
              rows={4}
              value={values.description}
              onChange={handleInputValue}
              sx={{ marginBottom: "16px" }}
              {...(errors.description && { error: true, helperText: errors.description })}
            />

            <FormControl
              fullWidth
              sx={{ marginBottom: "16px" }}
              {...(errors.category && { error: true })}
            >
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                id="category"
                name="category"
                label="Category"
                value={values.category}
                onChange={handleInputValue}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>

            <Box sx={{ marginBottom: "16px" }}>
              <Typography variant="caption" sx={{ display: "block", marginBottom: "8px" }}>
                Current Images
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {oldImages?.map((image, index) => (
                  <Avatar
                    key={index}
                    src={image.url}
                    sx={{ width: 60, height: 60 }}
                    variant="square"
                    alt="Old Images"
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ marginBottom: "16px" }}>
              <Typography variant="caption" sx={{ display: "block", marginBottom: "8px" }}>
                New Image Previews
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {imagesPreview.map((image, index) => (
                  <Avatar
                    key={index}
                    src={image}
                    sx={{ width: 60, height: 60 }}
                    variant="square"
                    alt="New Images"
                  />
                ))}
              </Box>
            </Box>

            <Button
              sx={{ marginBottom: "24px", backgroundColor: "secondary.main" }}
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Upload Images
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={updateProductImagesChange}
                hidden
                multiple
              />
            </Button>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ padding: "12px", backgroundColor: "secondary.main" }}
              disabled={!formIsValid()}
            >
              Update
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ maxWidth: "720px", margin: "24px auto 0" }}>
        <UpdateReviews reviews={reviews} deleteReviewHandler={deleteReviewHandler} />
      </Box>
    </div>
  );
}

export default UpdateProduct;
