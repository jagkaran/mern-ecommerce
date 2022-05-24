import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clearErrors,
  getProductDetails,
  newReview,
} from "../../actions/productAction";
import { useParams } from "react-router-dom";
import { Button, CircularProgress, Rating } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import Reviewcard from "../Reviewcard";
import { useAlert } from "react-alert";
import Copyright from "../Copyright";
import Seo from "../Seo";
import { addItemsToCart } from "../../actions/cartAction";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

function ProductDetails() {
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
        title={`${product.name} | PDP`}
        description={`${product.description} | PDP`}
        path={`/product/${id}`}
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <section className="text-gray-700 body-font overflow-hidden bg-white">
          <div className="container px-5 py-24 mx-auto">
            <div className="lg:w-4/5 mx-auto flex flex-wrap">
              {product.images &&
                product.images.map((item, i) => (
                  <img
                    alt="ecommerce"
                    className="lg:w-1/2 w-full object-cover object-center rounded border border-gray-200"
                    src={item.url}
                    key={item.url}
                  />
                ))}

              <div className="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
                <h2 className="text-sm uppercase title-font text-gray-500 tracking-widest">
                  {product.category}
                </h2>
                <h1 className="text-gray-900 text-3xl title-font font-medium mb-1">
                  {product.name}
                </h1>
                <p className="text-gray-600 mb-1">Product ID : {product._id}</p>
                <div className="flex mb-4">
                  <span className="flex items-center">
                    <Rating
                      name="half-rating-read"
                      value={product.ratings}
                      precision={0.5}
                      readOnly
                    />
                    <span className="text-gray-600 ml-3">
                      {product.numOfReviews} Reviews
                    </span>
                  </span>
                </div>
                <p className="leading-relaxed">{product.description}</p>
                <div className="flex mt-6 items-center pb-5 border-b-2 border-gray-200 mb-5">
                  <div className="flex">
                    <button onClick={decreaseQty}>
                      <RemoveCircleOutlineIcon />
                    </button>
                    <input
                      className="border-none ml-4 w-6 outline-none appearance-none font-sans text-gray-800"
                      value={quantity}
                      type="number"
                      onChange={(e) => setQuantity(e.target.value)}
                    ></input>
                    <button onClick={increaseQty}>
                      <AddCircleOutlineIcon />
                    </button>
                  </div>
                </div>
                <div className="flex">
                  <span className="title-font font-medium text-2xl text-gray-900">
                    ${product.price}
                  </span>
                  <button
                    className={
                      product.stock === 0
                        ? "flex ml-auto px-4 py-2 transition ease-in duration-200 uppercase rounded-full border-2 border-gray-900 opacity-50 cursor-not-allowed "
                        : "flex ml-auto px-4 py-2 transition ease-in duration-200 uppercase rounded-full hover:bg-gray-800 hover:text-white border-2 border-gray-900 focus:outline-none"
                    }
                    onClick={() =>
                      product.stock !== 0 && addToCartHandler(quantity)
                    }
                  >
                    Add to cart
                  </button>
                </div>
                <p>
                  Status: {}
                  <b
                    className={
                      product.stock < 1 ? "text-red-500" : "text-green-500"
                    }
                  >
                    {product.stock < 1 ? "Out of Stock" : "Available"}
                  </b>
                </p>
                <button
                  onClick={handleClickOpen}
                  className="mt-8 ml-auto px-4 py-2 transition ease-in duration-200 uppercase rounded-full hover:bg-gray-800 hover:text-white border-2 border-gray-900 focus:outline-none"
                >
                  Submit a Review
                </button>
                <Dialog open={open} onClose={handleClose}>
                  <DialogTitle>Submit a Review</DialogTitle>
                  <DialogContent>
                    <Rating
                      name="half-rating-read"
                      value={rating}
                      onChange={(e, newValue) => setRating(newValue)}
                    />
                    <TextField
                      autoFocus
                      margin="dense"
                      id="comment"
                      multiline
                      rows={4}
                      value={comment}
                      label="Add a comment"
                      onChange={(e) => setComment(e.target.value)}
                      fullWidth
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={reviewSubmitHandler}>Submit</Button>
                  </DialogActions>
                </Dialog>
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-800 text-center mt-10 mb-10">
              Reviews
            </h3>
            {product.reviews && product.reviews[0] ? (
              <div className="flex flex-col space-y-6 items-center">
                {product.reviews &&
                  product.reviews.map(
                    ({ name, rating, comment, _id, profileImg, createdAt }) => (
                      <Reviewcard
                        key={_id}
                        rating={rating}
                        comment={comment}
                        name={name}
                        profileImg={profileImg}
                      />
                    )
                  )}
              </div>
            ) : (
              <p className="text-gray-600 text-center mt-8">No Reviews Yet</p>
            )}
          </div>
        </section>
      )}
      <Copyright />
    </>
  );
}

export default ProductDetails;
