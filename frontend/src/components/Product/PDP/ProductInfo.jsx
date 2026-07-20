import { Box, Button, Divider, Rating } from "@mui/material";
import { useCurrency } from "../../../utils/currencyContext";
import React from "react";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import SubmitReviewDialog from "./SubmitReviewDialog";
import { Headline, BodyText, Overline, QtyStepper, Badge } from "../../../design/primitives";

// PDP right rail — info, price, qty, add-to-cart, review entry.
// Aligned with Hverdag primitive palette; surfaces MUI Button only where
// the action needs a contained/primary fill (Add to Cart).
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
  const { fmt } = useCurrency();

  const lowStock = stock > 0 && stock <= 3;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: { xs: 2.5, md: 3 },
      }}
    >
      {/* Category eyebrow — Overline primitive keeps cadence consistent */}
      {category && (
        <Overline sx={{ textTransform: "capitalize", color: "var(--t-neutral-500)" }}>
          {category}
        </Overline>
      )}

      <Headline level="3xl" sx={{ fontFamily: "var(--t-fontFamily-display)" }}>
        {name}
      </Headline>

      {/* Rating row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Rating
          name="product-rating"
          value={ratings}
          precision={0.5}
          readOnly
          size="small"
          sx={{ color: "var(--t-primary-600)" }}
        />
        <BodyText small sx={{ color: "var(--t-neutral-600)" }}>
          {numOfReviews} {numOfReviews === 1 ? "Review" : "Reviews"}
        </BodyText>
      </Box>

      {/* Description */}
      <BodyText sx={{ color: "var(--t-neutral-700)", lineHeight: 1.7 }}>{description}</BodyText>

      <Divider />

      {/* Qty + price + Add — single horizontal row on desktop, stacks on mobile */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          gap: { xs: 2.5, md: 3 },
          py: 1,
        }}
      >
        <QtyStepper
          value={quantity}
          min={1}
          max={stock || 99}
          onChange={setQuantity}
          ariaLabel="Quantity"
        />

        <Headline
          level="2xl"
          sx={{
            fontFamily: "var(--t-fontFamily-display)",
            color: "var(--t-neutral-900)",
            ml: { md: "auto" },
          }}
        >
          {fmt(price)}
        </Headline>
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={stock === 0}
        startIcon={<AddShoppingCartIcon />}
        onClick={() => stock !== 0 && addToCartHandler(quantity)}
        sx={{
          backgroundColor: "var(--t-primary-700)",
          color: "var(--t-neutral-50)",
          borderRadius: "var(--t-border-radius-base)",
          py: 1.5,
          fontFamily: "var(--t-fontFamily-body)",
          fontWeight: 500,
          letterSpacing: "0.02em",
          textTransform: "none",
          boxShadow: "var(--t-shadow-sm)",
          transition:
            "background-color var(--t-motion-duration-fast) var(--t-motion-easing-out), transform var(--t-motion-duration-fast) var(--t-motion-easing-out)",
          "&:hover": {
            backgroundColor: "var(--t-primary-800)",
            boxShadow: "var(--t-shadow-md)",
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
          "&.Mui-disabled": {
            backgroundColor: "var(--t-neutral-200)",
            color: "var(--t-neutral-500)",
          },
        }}
      >
        {stock === 0 ? "Out of Stock" : "Add to Cart"}
      </Button>

      {/* Status badge */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <BodyText small sx={{ color: "var(--t-neutral-600)" }}>
          Status:
        </BodyText>
        <Badge variant={stock === 0 ? "error" : lowStock ? "warning" : "success"}>
          {stock < 1 ? "Out of Stock" : lowStock ? `Only ${stock} left` : "Available"}
        </Badge>
      </Box>

      <Divider />

      {/* Review entry — pulled to bottom of column */}
      <Box sx={{ mt: "auto", pt: 1 }}>
        <Button
          variant="outlined"
          fullWidth
          size="large"
          endIcon={<RateReviewIcon />}
          onClick={handleClickOpen}
          sx={{
            borderColor: "var(--t-neutral-300)",
            color: "var(--t-neutral-900)",
            borderRadius: "var(--t-border-radius-base)",
            py: 1.25,
            fontFamily: "var(--t-fontFamily-body)",
            fontWeight: 500,
            textTransform: "none",
            letterSpacing: "0.02em",
            transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
            "&:hover": {
              borderColor: "var(--t-primary-700)",
              backgroundColor: "var(--t-primary-50)",
              color: "var(--t-primary-800)",
            },
          }}
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
    </Box>
  );
}

export default ProductInfo;
