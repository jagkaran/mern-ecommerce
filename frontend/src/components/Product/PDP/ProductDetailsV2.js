import ImageGrid from "./ImageGrid";
import MainImage from "./MainImage";
import ProductInfo from "./ProductInfo";
import { Grid, Typography } from "@mui/material";
import Seo from "../../Seo";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clearErrors,
  getProductDetails,
  newReview,
} from "../../../actions/productAction";
import { useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";

import Reviewcard from "../../Reviewcard";
import { useAlert } from "react-alert";
import Copyright from "../../Copyright";
import { addItemsToCart } from "../../../actions/cartAction";

function ProductDetailsV2() {
  const [selectedImage, setSelectedImage] = useState(0);
  const dispatch = useDispatch();
  const alert = useAlert();
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );

  const { success, error: reviewError } = useSelector(
    (state) => state.newReview
  );

  const increaseQty = () => {
    if (product.stock <= quantity) return;

    const qty = quantity + 1;
    setQuantity(qty);
  };

  const decreaseQty = () => {
    if (1 >= quantity) return;

    const qty = quantity - 1;
    setQuantity(qty);
  };

  const addToCartHandler = (quantity) => {
    dispatch(addItemsToCart(id, quantity));
    alert.success(`${product.name} Added to Cart Successfully`);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const reviewSubmitHandler = () => {
    const myForm = new FormData();

    myForm.set("rating", rating);
    myForm.set("comment", comment);
    myForm.set("productId", id);

    dispatch(newReview(myForm));

    setOpen(false);
  };

  useEffect(() => {
    if (error) {
      return alert.error(error);
    }
    if (reviewError) {
      alert.error(reviewError);
      dispatch(clearErrors());
    }

    if (success) {
      alert.success("Review Submitted Successfully");
      dispatch({ type: "NewReviewReset" });
    }
    dispatch(getProductDetails(id));
  }, [dispatch, id, error, alert, reviewError, success]);

  return (
    <>
      <Seo
        title={`${product.name} - Click.it Store`}
        description={`${product.description} - available only on Click.it Store`}
        path={`/product/${id}`}
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <>
          <Grid container spacing={2} sx={{ maxWidth: 1100, m: "0 auto" }}>
            <Grid item xs={2} md={2} lg={1}>
              <ImageGrid
                images={product.images && product.images}
                onSelect={setSelectedImage}
                selectedImage={selectedImage}
              />
            </Grid>
            <Grid item xs={10} md={10} lg={6}>
              <MainImage
                src={product.images && product.images[selectedImage].url}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={5}>
              <ProductInfo
                {...product}
                quantity={quantity}
                setQuantity={setQuantity}
                decreaseQty={decreaseQty}
                increaseQty={increaseQty}
                addToCartHandler={addToCartHandler}
                open={open}
                handleClose={handleClose}
                rating={rating}
                setRating={setRating}
                comment={comment}
                setComment={setComment}
                reviewSubmitHandler={reviewSubmitHandler}
                handleClickOpen={handleClickOpen}
              />
            </Grid>
          </Grid>
          <Grid
            container
            spacing={2}
            sx={{ maxWidth: 800, m: "0 auto", mt: 6, justifyContent: "center" }}
          >
            <Typography mt={2} mb={3} variant="h6">
              Reviews
            </Typography>
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map(
                ({ name, rating, comment, _id, profileImg }) => (
                  <Reviewcard
                    key={_id}
                    rating={rating}
                    comment={comment}
                    name={name}
                    profileImg={profileImg}
                  />
                )
              )
            ) : (
              <Grid
                container
                spacing={2}
                sx={{
                  maxWidth: 800,
                  m: "0 auto",
                  mt: 6,
                  justifyContent: "center",
                }}
              >
                <Typography mt={2} variant="subtitle1">
                  No Reviews Yet
                </Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}
      <Copyright />
    </>
  );
}

export default ProductDetailsV2;
