import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAlert } from "react-alert";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { createProduct, clearErrors } from "../../../actions/productAction";
import { NEW_PRODUCT_RESET } from "../../../constants/productConstants";
import AdminSidebar from "../AdminSidebar";
import { useProductForm, CATEGORIES } from "../../../hooks/useProductForm";

function CreateProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const { loading, error, success } = useSelector((state) => state.newProduct);

  const { values, errors, touched, handleChange, handleBlur, validateAll, isValid, fieldProps, setValues } =
    useProductForm();

  // images state remains local — not part of form validation hook
  const [images, setImages] = React.useState([]);
  const [imagesPreview, setImagesPreview] = React.useState([]);

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (success) {
      alert.success("Product created successfully");
      navigate("/admin/products");
      dispatch({ type: NEW_PRODUCT_RESET });
    }
  }, [error, success, alert, navigate, dispatch]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([]);
    setImagesPreview([]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview((prev) => [...prev, reader.result]);
          setImages((prev) => [...prev, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("price", values.price);
    formData.set("description", values.description);
    formData.set("category", values.category);
    formData.set("stock", values.stock);
    images.forEach((img) => formData.append("images", img));
    dispatch(createProduct(formData));
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, maxWidth: 600 }}
      >
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Create Product
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Product Name */}
          <TextField
            required
            fullWidth
            id="name"
            name="name"
            label="Product Name"
            value={values.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
            {...fieldProps("name")}
          />

          {/* Price */}
          <TextField
            required
            fullWidth
            id="price"
            name="price"
            label="Price"
            type="number"
            value={values.price}
            onChange={handleChange}
            inputProps={{ min: 0, step: "0.01" }}
            sx={{ mb: 2 }}
            {...fieldProps("price")}
          />

          {/* Description */}
          <TextField
            required
            fullWidth
            id="description"
            name="description"
            label="Description"
            multiline
            rows={4}
            value={values.description}
            onChange={handleChange}
            sx={{ mb: 2 }}
            {...fieldProps("description")}
          />

          {/* Category */}
          <FormControl
            fullWidth
            required
            sx={{ mb: 2 }}
            error={Boolean(touched["category"] && errors["category"])}
          >
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={values.category}
              label="Category"
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
            {touched["category"] && errors["category"] && (
              <FormHelperText>{errors["category"]}</FormHelperText>
            )}
          </FormControl>

          {/* Stock */}
          <TextField
            required
            fullWidth
            id="stock"
            name="stock"
            label="Stock"
            type="number"
            value={values.stock}
            onChange={handleChange}
            inputProps={{ min: 0, step: 1 }}
            sx={{ mb: 2 }}
            {...fieldProps("stock")}
          />

          {/* Images */}
          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" component="label">
              Upload Images
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                hidden
              />
            </Button>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {imagesPreview.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`preview-${idx}`}
                  width={80}
                  height={80}
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              ))}
            </Box>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!isValid() || loading}
            sx={{ mt: 1, py: 1.5, bgcolor: "secondary.main" }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create Product"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default CreateProduct;
