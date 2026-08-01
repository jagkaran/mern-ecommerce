import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  TextField,
} from "@mui/material";
import React, { useEffect } from "react";
import { useLenisStop } from "../../../utils/lenis";

function SubmitReviewDialog({
  open,
  handleClose,
  rating,
  setRating,
  comment,
  setComment,
  reviewSubmitHandler,
}) {
  // Pause Lenis while the dialog is open so the page behind doesn't scroll.
  useLenisStop(open);
  return (
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
  );
}

export default SubmitReviewDialog;
