import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import {
  CircularProgress,
  Container,
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
import { useAlert } from "react-alert";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useEffect } from "react";
import CategoryIcon from "@mui/icons-material/Category";
import { useFormControls } from "../Hooks/useFormControl";
import UpdateReviews from "./UpdateReviews";
import Seo from "../../Seo";
import Copyright from "../../Copyright";

function UpdateProduct() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const { id } = useParams();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const alert = useAlert();

  const {
    loading,
    error: updateError,
    isUpdated,
  } = useSelector((state) => state.modifiedProduct);
  const { error, product } = useSelector((state) => state.productDetails);
  const { error: deleteReviewError, isDeleted } = useSelector(
    (state) => state.review
  );
  const { error: allReviewsError, reviews } = useSelector(
    (state) => state.allReviews
  );

  const [images, setImages] = useState([]);
  const [oldImages, setOldImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);
  const history = useNavigate();

  const { handleInputValue, formIsValid, errors, values, setValues } =
    useFormControls();

  const categories = [
    {
      id: 1,
      name: "laptop",
    },
    {
      id: 2,
      name: "footwear",
    },
    {
      id: 3,
      name: "bottom",
    },
    {
      id: 4,
      name: "clothing",
    },
    {
      id: 5,
      name: "tops",
    },
    {
      id: 6,
      name: "shoes",
    },
    {
      id: 7,
      name: "camera",
    },
    {
      id: 8,
      name: "smartphones",
    },
    {
      id: 9,
      name: "accessories",
    },
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

      images.forEach((image) => {
        myForm.append("images", image);
      });
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

  useEffect(() => {
    if (product && product._id !== id) {
      dispatch(getProductDetails(id));
    } else {
      setValues({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
      });
      setOldImages(product.images);
    }
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (updateError) {
      alert.error(updateError);
      dispatch(clearErrors());
    }
    if (allReviewsError) {
      alert.error(allReviewsError);
      dispatch(clearErrors());
    }
    if (deleteReviewError) {
      alert.error(deleteReviewError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      alert.success("Review Deleted Successfully");
      history("/admin/products");
      dispatch({ type: "DeleteReviewReset" });
    }
    if (isUpdated) {
      alert.success("Product Updated Successfully");
      history("/admin/products");
      dispatch({ type: "UpdateProductReset" });
    }
    dispatch(getAllReviews(id));
  }, [
    dispatch,
    error,
    alert,
    history,
    isUpdated,
    updateError,
    id,
    product,
    allReviewsError,
    deleteReviewError,
    isDeleted,
  ]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Update Product Details - Click.it Dashboard - Admin access only"
          description="Dashboard panel to manage available products on Click.it store"
          path="/admin/product/update"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer
          open={open}
          handleDrawerClose={handleDrawerClose}
          theme={theme}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 8,
          }}
        >
          <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12} lg={6}>
                {loading ? (
                  <div className="grid place-items-center h-screen">
                    <CircularProgress />
                  </div>
                ) : (
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
                      Update Product
                    </Typography>
                    <Box
                      component="form"
                      noValidate
                      onSubmit={updateProductSubmitHandler}
                      sx={{ mt: 3 }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            name="name"
                            fullWidth
                            id="name"
                            label="Product Name"
                            autoFocus
                            required
                            value={values.name}
                            onChange={handleInputValue}
                            {...(errors.name && {
                              error: true,
                              helperText: errors.name,
                            })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            required
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            id="price"
                            label="Product Price"
                            name="price"
                            type="number"
                            value={values.price}
                            onChange={handleInputValue}
                            {...(errors.price && {
                              error: true,
                              helperText: errors.price,
                            })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            required
                            fullWidth
                            name="description"
                            label="Product Description"
                            id="description"
                            value={values.description}
                            onChange={handleInputValue}
                            {...(errors.description && {
                              error: true,
                              helperText: errors.description,
                            })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl
                            fullWidth
                            {...(errors.category && { error: true })}
                          >
                            <InputLabel id="category-select-label">
                              Category
                            </InputLabel>
                            <Select
                              labelId="category-select-label"
                              id="category"
                              name="category"
                              label="Select Category"
                              value={values.category}
                              onChange={handleInputValue}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {categories.map((category) => (
                                <MenuItem
                                  key={category.id}
                                  value={category.name}
                                >
                                  <span className="capitalize">
                                    {category.name}
                                  </span>
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.category && (
                              <FormHelperText>{errors.category}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            required
                            fullWidth
                            name="stock"
                            label="Product Stock"
                            id="stock"
                            InputLabelProps={{ shrink: true }}
                            value={values.stock}
                            onChange={handleInputValue}
                            {...(errors.stock && {
                              error: true,
                              helperText: errors.stock,
                            })}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Typography
                            variant="caption"
                            display="block"
                            gutterBottom
                          >
                            Old Images:
                          </Typography>
                          {oldImages?.map((image, index) => (
                            <Avatar
                              key={index}
                              src={image.url}
                              sx={{ m: 1, width: 60, height: 80 }}
                              variant="square"
                              alt="Old Images"
                            ></Avatar>
                          ))}
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          mt={2}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Typography
                            variant="caption"
                            display="block"
                            gutterBottom
                          >
                            New Images:
                          </Typography>
                          {imagesPreview.map((image, index) => (
                            <Avatar
                              key={index}
                              src={image}
                              sx={{ m: 1, width: 60, height: 80 }}
                              variant="square"
                              alt="New Images"
                            ></Avatar>
                          ))}
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          <Button
                            sx={{ m: 1, backgroundColor: "secondary.main" }}
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
                        </Grid>
                      </Grid>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
                        disabled={!formIsValid()}
                      >
                        Update
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>
              <UpdateReviews
                reviews={reviews && reviews}
                deleteReviewHandler={deleteReviewHandler}
              />
            </Grid>
          </Container>
        </Box>
      </Box>
      <Copyright />
    </>
  );
}

export default UpdateProduct;
