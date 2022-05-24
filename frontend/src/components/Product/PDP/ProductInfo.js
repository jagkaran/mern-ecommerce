import { Box, Button, Divider, Grid, Rating, Typography } from "@mui/material";
import React from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SeverityPill from "../../Order/SeverityPill";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import SubmitReviewDialog from "./SubmitReviewDialog";

function ProductInfo({
  category,
  description,
  name,
  price,
  ratings,
  _id,
  numOfReviews,
  quantity,
  setQuantity,
  decreaseQty,
  increaseQty,
  stock,
  addToCartHandler,
  open,
  handleClose,
  rating,
  setRating,
  comment,
  setComment,
  reviewSubmitHandler,
  handleClickOpen,
}) {
  return (
    <Grid container direction="column" sx={{ height: "100%" }}>
      <Typography
        mb={1}
        variant="subtitle1"
        sx={{ textTransform: "capitalize" }}
      >
        {category}
      </Typography>
      <Divider />
      <Box mt={2}>
        <Typography variant="h4">{name}</Typography>
        <Typography variant="subtitle1">Product ID : {_id}</Typography>
        <Box sx={{ display: "flex" }}>
          <Rating
            name="half-rating-read"
            value={ratings}
            precision={0.5}
            readOnly
          />

          <Typography variant="subtitle1" ml={2}>
            {numOfReviews} {numOfReviews > 1 ? "Reviews" : "Review"}
          </Typography>
        </Box>
        <Typography mt={2} variant="subtitle1">
          {description}
        </Typography>
        <Box sx={{ display: "flex", mt: 3, mb: 2 }}>
          <button onClick={decreaseQty}>
            <RemoveCircleOutlineIcon />
          </button>
          <input
            className="border-none ml-4 w-6 outline-none appearance-none text-gray-800"
            value={quantity}
            type="number"
            onChange={(e) => setQuantity(e.target.value)}
          ></input>
          <button onClick={increaseQty}>
            <AddCircleOutlineIcon />
          </button>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            mb: 2,
          }}
        >
          <Typography variant="h5">${price}</Typography>
          <Button
            variant="contained"
            sx={{ m: "auto" }}
            size="large"
            disabled={stock === 0 ? true : false}
            startIcon={<AddShoppingCartIcon />}
            onClick={() => stock !== 0 && addToCartHandler(quantity)}
          >
            Add to Cart
          </Button>
        </Box>
        Status :{" "}
        <SeverityPill
          color={
            (stock === 0 && "error") ||
            (stock <= 3 && "warning") ||
            (stock >= 3 && "success") ||
            "error"
          }
        >
          {stock < 1 ? "Out of Stock" : "Available"}
        </SeverityPill>
      </Box>
      <Box maxWidth="100" mt={3}>
        <Button
          variant="outlined"
          sx={{ mt: "auto" }}
          size="large"
          endIcon={<RateReviewIcon />}
          onClick={handleClickOpen}
        >
          Submit a Review
        </Button>
      </Box>
      <SubmitReviewDialog
        open={open}
        handleClose={handleClose}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        reviewSubmitHandler={reviewSubmitHandler}
      />
    </Grid>
  );
}

export default ProductInfo;
