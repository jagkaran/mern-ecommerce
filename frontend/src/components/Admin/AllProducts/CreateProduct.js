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
import { clearErrors, createProduct } from "../../../actions/productAction";
import { useAlert } from "react-alert";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useEffect } from "react";
import CategoryIcon from "@mui/icons-material/Category";
import { useFormControls } from "../Hooks/useFormControl";
import Seo from "../../Seo";
import Copyright from "../../Copyright";

function CreateProduct() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const alert = useAlert();
  const { loading, error, success } = useSelector((state) => state.newProduct);
  const [images, setImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);
  const history = useNavigate();

  const { handleInputValue, formIsValid, errors, values } = useFormControls();

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

  const createProductSubmitHandler = (e) => {
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
      dispatch(createProduct(myForm));
    }
  };

  const createProductImagesChange = (e) => {
    const files = Array.from(e.target.files);

    setImages([]);
    setImagesPreview([]);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview((old) => [...old, reader.result]);
          setImages((old) => [...old, reader.result]);
        }
      };
      if (file.size > 760000) {
        alert.error("Please upload an image smaller than 750 KB");
        return false;
      }
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }

    if (success) {
      alert.success("Product Created Successfully");
      history("/dashboard");
      dispatch({ type: "NewProductReset" });
    }
  }, [dispatch, error, alert, history, success]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Create a Product - Click.it store - Admin access only."
          description="Create amazing products and inventory on Click.it store"
          path="/admin/product/new"
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
          <Container maxWidth="xs" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
                      Create a Product
                    </Typography>
                    <Box
                      component="form"
                      noValidate
                      onSubmit={createProductSubmitHandler}
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
                            <InputLabel id="demo-simple-select-label">
                              Category
                            </InputLabel>
                            <Select
                              labelId="category-select-label"
                              id="category-select"
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
                            type="number"
                            InputLabelProps={{ shrink: true }}
                            value={values.stock}
                            onChange={handleInputValue}
                            {...(errors.stock && {
                              error: true,
                              helperText: errors.stock,
                            })}
                          />
                        </Grid>
                        <Grid item xs={6} sx={{ display: "flex" }}>
                          {imagesPreview.map((image, index) => (
                            <Avatar
                              src={image}
                              key={index}
                              sx={{ m: 1 }}
                              variant="square"
                            ></Avatar>
                          ))}
                        </Grid>
                        <Grid item xs={6}>
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
                              onChange={createProductImagesChange}
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
                        disabled={!formIsValid() || images.length === 0}
                      >
                        Create
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Copyright />
    </>
  );
}

export default CreateProduct;
