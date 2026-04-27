import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAlert } from "react-alert";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import {
  Avatar,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import { createProduct, clearErrors } from "../../../actions/productAction";
import { useProductForm, CATEGORIES } from "../../../hooks/useProductForm";
import Copyright from "../../Copyright";
import Seo from "../../Seo";

function CreateProduct() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const { loading, error, success } = useSelector((state) => state.newProduct);

  const { values, errors, touched, handleChange, handleBlur, validateAll, isValid, fieldProps } =
    useProductForm();

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
      dispatch({ type: "NewProductReset" });
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
    const myForm = new FormData();
    myForm.set("name", values.name);
    myForm.set("price", values.price);
    myForm.set("description", values.description);
    myForm.set("category", values.category);
    myForm.set("stock", values.stock);
    images.forEach((img) => myForm.append("images", img));
    dispatch(createProduct(myForm));
  };

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Create Product - Click.it Dashboard - Admin access only"
          description="Dashboard panel to create a new product on Click.it store"
          path="/admin/product/new"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer
          open={open}
          handleDrawerClose={handleDrawerClose}
          theme={theme}
        />
        <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
          <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <CategoryIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Create Product
              </Typography>

              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{ mt: 3, width: "100%" }}
              >
                <Grid container spacing={2}>
                  {/* Product Name */}
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      id="name"
                      name="name"
                      label="Product Name"
                      autoFocus
                      value={values.name}
                      onChange={handleChange}
                      {...fieldProps("name")}
                    />
                  </Grid>

                  {/* Price */}
                  <Grid item xs={12}>
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
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
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
                      {...fieldProps("description")}
                    />
                  </Grid>

                  {/* Category */}
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      required
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
                  </Grid>

                  {/* Stock */}
                  <Grid item xs={12}>
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
                  </Grid>

                  {/* Image upload */}
                  <Grid item xs={12} sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Button
                      variant="contained"
                      component="label"
                      sx={{ bgcolor: "secondary.main" }}
                    >
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
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={!isValid() || loading}
                  sx={{ mt: 3, mb: 2, bgcolor: "secondary.main" }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
      <Copyright />
    </>
  );
}

export default CreateProduct;
