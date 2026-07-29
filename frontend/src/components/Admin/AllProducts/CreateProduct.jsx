import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import { createProduct, clearErrors } from "../../../actions/productAction";
import { useProductForm, CATEGORIES } from "../../../hooks/useProductForm";
import Seo from "../../Seo";

function CreateProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const { loading, error, success } = useSelector((state) => state.newProduct);

  const { values, errors, touched, handleChange, handleBlur, validateAll, isValid, fieldProps } =
    useProductForm();

  const [images, setImages] = React.useState([]);
  const [imagesPreview, setImagesPreview] = React.useState([]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (success) {
      toast.success("Product created successfully");
      navigate("/admin/products");
      dispatch({ type: "NewProductReset" });
    }
  }, [dispatch, error, success, toast, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    const myForm = new FormData();
    myForm.set("name", values.name);
    myForm.set("price", values.price);
    myForm.set("description", values.description);
    myForm.set("category", values.category);
    myForm.set("stock", values.stock);
    images.forEach((image) => myForm.append("images", image));
    dispatch(createProduct(myForm));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([]);
    setImagesPreview([]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview((prev) => [...prev, reader.result]);
          setImages((prev) => [...prev, file]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ padding: "24px 16px" }}>
      <Seo
        title="Create Product - Click.it Dashboard - Admin access only"
        description="Dashboard panel to create a new product on Click.it store"
        path="/admin/product/new"
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
            Create Product
          </Typography>
        </Box>

        <Box component="form" noValidate onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            id="name"
            name="name"
            label="Product Name"
            autoFocus
            value={values.name}
            onChange={handleChange}
            sx={{ marginBottom: "16px" }}
            {...fieldProps("name")}
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
              id="price"
              name="price"
              label="Price"
              type="number"
              value={values.price}
              onChange={handleChange}
              inputProps={{ min: 0, step: "0.01" }}
              {...fieldProps("price")}
            />
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
              {...fieldProps("stock")}
            />
          </Box>

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
            sx={{ marginBottom: "16px" }}
            {...fieldProps("description")}
          />

          <FormControl
            fullWidth
            required
            error={Boolean(touched.category && errors.category)}
            sx={{ marginBottom: "16px" }}
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
            {touched.category && errors.category && (
              <FormHelperText>{errors.category}</FormHelperText>
            )}
          </FormControl>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              marginBottom: "24px",
            }}
          >
            <Button variant="contained" component="label" sx={{ bgcolor: "secondary.main" }}>
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
            {imagesPreview.map((img, idx) => (
              <Avatar
                key={idx}
                src={img}
                sx={{ width: 60, height: 60 }}
                variant="square"
                alt={`preview-${idx}`}
              />
            ))}
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!isValid() || loading}
            sx={{ padding: "12px", bgcolor: "secondary.main" }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create Product"}
          </Button>
        </Box>
      </Box>
    </div>
  );
}

export default CreateProduct;