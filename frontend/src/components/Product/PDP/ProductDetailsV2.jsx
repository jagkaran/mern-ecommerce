import ImageDots from "./ImageDots";
import ImageGrid from "./ImageGrid";
import ImageLightbox from "./ImageLightbox";
import MainImage from "./MainImage";
import ProductInfo from "./ProductInfo";
import StickyATC from "./StickyATC";
import { Grid2 as Grid, Typography, Box, Button, Container } from "@mui/material";
import Seo from "../../Seo";
import JsonLd from "../../JsonLd";
import { productJsonLd } from "../../../utils/jsonLd";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getProductDetails, newReview } from "../../../actions/productAction";
import { useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import Reviewcard from "../../Reviewcard";
import { useToast } from "../../../hooks/useToast";
import { addItemsToCart } from "../../../actions/cartAction";
import { Disclosure, MotionDisclosure, Overline, Headline, Breadcrumb } from "../../../design/primitives";
import ProductGrid from "../ProductGrid";
import { getProduct } from "../../../actions/productAction";
import { useScrollToAnchor } from "../../../utils/lenis";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

function ProductDetailsV2() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollToAnchor = useScrollToAnchor();
  const openLightbox = React.useCallback(() => setLightboxOpen(true), []);
  const dispatch = useDispatch();
  const toast = useToast();
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [stickyVisible, setStickyVisible] = useState(false);

  // Mobile sticky ATC: show only when the in-page ATC button has scrolled
  // ABOVE the viewport (not merely "not intersecting"). IntersectionObserver
  // — no scroll listeners.
  //
  // Uses a callback ref rather than a one-shot effect with [] deps so the
  // observer re-binds when the sentinel remounts (e.g. the loading branch
  // unmounts the whole tree and the success branch mounts a fresh one).
  // The callback runs again with `node = null` when the sentinel unmounts
  // (or when the component itself unmounts) — we tear down the prior
  // observer and reset stickyVisible.
  //
  // `entry.boundingClientRect.bottom <= 0` means the sentinel has scrolled
  // past the top edge (genuinely "above the viewport"). The plain
  // `!isIntersecting` form also fires for "below the viewport" on initial
  // load, which would show the sticky bar at the bottom of the page before
  // the user has scrolled — wrong UX.
  const sentinelIoRef = React.useRef(null);
  const attachSentinel = React.useCallback((node) => {
    sentinelIoRef.current?.disconnect();
    sentinelIoRef.current = null;
    if (!node) {
      setStickyVisible(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const aboveViewport = entry.boundingClientRect.bottom <= 0;
        setStickyVisible(aboveViewport);
      },
      { threshold: 0 }
    );
    io.observe(node);
    sentinelIoRef.current = io;
  }, []);

  const { loading, error, product } = useSelector((state) => state.productDetails);

  const { products: allProducts } = useSelector((state) => state.product);
  const related = (allProducts || [])
    .filter((p) => p._id !== id && p.category === product?.category)
    .slice(0, 4);

  const { success, error: reviewError } = useSelector((state) => state.newReview);

  const increaseQty = () => {
    if (product.stock <= quantity) return;
    setQuantity(quantity + 1);
  };

  const decreaseQty = () => {
    if (1 >= quantity) return;
    setQuantity(quantity - 1);
  };

  const addToCartHandler = (quantity) => {
    dispatch(addItemsToCart(id, quantity));
    toast.success(`${product?.name || "Product"} Added to Cart`);
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
      toast.error(error);
      dispatch(clearErrors());
      return;
    }
    if (reviewError) {
      toast.error(reviewError);
      dispatch(clearErrors());
      return;
    }
    dispatch(getProductDetails(id));
  }, [dispatch, id, error, reviewError, toast]);

  useEffect(() => {
    if (success) {
      toast.success("Review Submitted");
      // Clear form state so reopening the dialog starts fresh — otherwise
      // the previous comment/rating linger and confuse the user (and break
      // the regression test that asserts a reset on success).
      setRating(0);
      setComment("");
      dispatch({ type: "NewReviewReset" });
      dispatch(getProductDetails(id));
    }
  }, [success, dispatch, id, toast, setRating, setComment]);

  // Related products: fetch same category
  useEffect(() => {
    if (product?.category) {
      dispatch(getProduct("", 1, [0, 5000], product.category, 0));
    }
  }, [product?.category, dispatch]);

  if (loading) {
    return (
      <div className="grid place-items-center h-screen">
        <CircularProgress sx={{ color: "var(--t-primary-600)" }} />
      </div>
    );
  }

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <Seo
        title={`${product?.name || "Product"} | Hverdag`}
        description={`${product?.description || ""} — made to last, mended for life.`}
        path={`/product/${id}`}
      />

      <Container
        maxWidth={false}
        sx={{ maxWidth: "var(--t-grid-containerMax)", pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 6 } }}
      >
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Shop", to: "/products" },
            product?.category && {
              label: product.category,
              to: `/products?category=${encodeURIComponent(product.category)}`,
            },
            { label: product?.name || "Product" },
          ].filter(Boolean)}
        />
      </Container>

      <Container
        maxWidth={false}
        sx={{ maxWidth: "var(--t-grid-containerMax)", px: "var(--t-grid-containerPad)" }}
      >
        <Grid container spacing={{ xs: 2, md: 4 }} className="pdp__gallery-row">
          <Grid size={{ xs: 12, md: 12, lg: 7 }} className="pdp__gallery-cell">
            {product?.images?.length > 0 && (
              <>
                {/*
                  md (900-1199): thumbs in a vertical column to the LEFT of main (2-of-12 + 10-of-12).
                  lg (>= 1200): thumbs hidden via CSS, dots shown, main takes whole cell.
                  xs (< 600): the inner row collapses to a column so the thumbs row
                    spans the full PDP width above the main image.
                */}
                <Grid container spacing={{ md: 2 }} className="pdp__thumbs-main-row">
                  <Grid size={{ xs: 12, md: 2 }} className="pdp__thumbs-md-cell">
                    <ImageGrid
                      images={product.images}
                      onSelect={setSelectedImage}
                      selectedImage={selectedImage}
                      className="pdp__thumbs pdp__thumbs--xs"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 10 }}>
                    <MainImage
                      src={product.images[selectedImage]?.url}
                      alt={product.name}
                      onOpen={openLightbox}
                    />
                  </Grid>
                </Grid>
                <ImageDots
                  images={product.images}
                  selectedImage={selectedImage}
                  onSelect={setSelectedImage}
                />
              </>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 12, lg: 5 }} className="pdp__info-cell">
            <div className="pdp__info-sticky">
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
            </div>
            {/* IO sentinel: when this in-page ATC has scrolled above the
                viewport, show the mobile sticky ATC bar at the bottom of
                the viewport. */}
            <div ref={attachSentinel} aria-hidden style={{ height: 1 }} />
          </Grid>
        </Grid>

        {product?.images?.length > 0 && (
          <ImageLightbox
            images={product.images}
            open={lightboxOpen}
            initialIndex={selectedImage}
            alt={product.name}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        <StickyATC
          price={product?.price}
          quantity={quantity}
          setQuantity={setQuantity}
          increaseQty={increaseQty}
          decreaseQty={decreaseQty}
          addToCartHandler={addToCartHandler}
          stock={product?.stock}
          visible={stickyVisible}
        />

        <Box id="pdp-details" sx={{ maxWidth: 720, mx: "auto", mt: { xs: 6, md: 10 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>
            <Overline sx={{ color: "var(--t-neutral-500)" }}>The details</Overline>
            <Button
              size="small"
              variant="text"
              onClick={() => scrollToAnchor("#pdp-reviews")}
              endIcon={<ArrowDownwardIcon fontSize="small" />}
              sx={{
                color: "var(--t-primary-700)",
                textTransform: "none",
                fontFamily: "var(--t-fontFamily-body)",
                fontWeight: 500,
                letterSpacing: "0.02em",
                "&:hover": { backgroundColor: "var(--t-primary-50)" },
              }}
            >
              Jump to reviews
            </Button>
          </Box>
          <MotionDisclosure title="Materials" defaultOpen>
            <p>
              Each piece is made from natural materials selected for the way they age. Wood is
              seasoned, ceramic is fired, linen is woven — never laminated, never plastic-coated.
            </p>
          </MotionDisclosure>
          <MotionDisclosure title="Care & mending">
            <p>
              We mend what we sell. Wood can be re-oiled, ceramic re-glazed, linen re-stitched. When
              something shows wear, send it back and we'll make it whole again — no questions, no
              charge, for as long as the piece is in your keeping.
            </p>
          </MotionDisclosure>
          <MotionDisclosure title="Shipping">
            <p>
              Sent in plastic-free packaging, with a handwritten note. Domestic orders arrive in 3–5
              days. International takes a little longer — usually 7–14. Returns are quiet and easy.
            </p>
          </MotionDisclosure>
        </Box>
      </Container>

      {related.length > 0 && (
        <Container
          maxWidth={false}
          sx={{
            maxWidth: "var(--t-grid-containerMax)",
            px: "var(--t-grid-containerPad)",
            py: { xs: 6, md: 10 },
            mt: { xs: 4, md: 6 },
            borderTop: "1px solid var(--t-neutral-200)",
          }}
        >
          <Overline sx={{ display: "block", mb: 2, color: "var(--t-neutral-500)" }}>
            More from the collection
          </Overline>
          <Headline level="3xl" sx={{ mb: 4 }}>
            You might also keep
          </Headline>
          <ProductGrid products={related} />
        </Container>
      )}

      <Container
        id="pdp-reviews"
        maxWidth={false}
        sx={{
          maxWidth: 800,
          px: "var(--t-grid-containerPad)",
          py: { xs: 6, md: 10 },
          borderTop: "1px solid var(--t-neutral-200)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2 }}>
          <Overline sx={{ color: "var(--t-neutral-500)" }}>Kept notes</Overline>
          <Button
            size="small"
            variant="text"
            onClick={() => scrollToAnchor("#pdp-details")}
            startIcon={<ArrowUpwardIcon fontSize="small" />}
            sx={{
              color: "var(--t-primary-700)",
              textTransform: "none",
              fontFamily: "var(--t-fontFamily-body)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              "&:hover": { backgroundColor: "var(--t-primary-50)" },
            }}
          >
            Jump to details
          </Button>
        </Box>
        <Headline level="2xl" sx={{ mb: 4 }}>
          Reviews
        </Headline>
        {product?.reviews && product.reviews.length > 0 ? (
          product.reviews.map(({ name, rating, comment, _id, profileImg, createdAt }) => (
            <Reviewcard
              key={_id}
              rating={rating}
              comment={comment}
              name={name}
              profileImg={profileImg}
              createdAt={createdAt}
            />
          ))
        ) : (
          <Typography
            sx={{
              color: "var(--t-neutral-500)",
              fontStyle: "italic",
              fontFamily: "var(--t-fontFamily-display)",
            }}
          >
            No reviews yet — be the first to share your thoughts.
          </Typography>
        )}
      </Container>
    </>
  );
}

export default ProductDetailsV2;
