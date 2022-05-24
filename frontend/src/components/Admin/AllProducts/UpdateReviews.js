import React from "react";
import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ReviewsIcon from "@mui/icons-material/Reviews";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SeverityPill from "../../Order/SeverityPill";

function UpdateReviews({ reviews, deleteReviewHandler }) {
  return (
    <Grid item xs={12} md={12} lg={6}>
      {reviews && reviews.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <ReviewsIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Update Reviews
          </Typography>
          <Card sx={{ mt: 3 }}>
            <CardHeader title={`All Reviews (${reviews.length})`} />
            <PerfectScrollbar>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow hover key={review._id}>
                      <TableCell>{review.name}</TableCell>
                      <TableCell>{review.comment}</TableCell>
                      <TableCell>
                        <SeverityPill
                          color={(review.rating >= 3 && "success") || "warning"}
                        >
                          {review.rating}
                        </SeverityPill>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => deleteReviewHandler(review._id)}>
                          <DeleteIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PerfectScrollbar>
          </Card>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "500px",
          }}
        >
          <Typography variant="h7" gutterBottom component="div">
            No Reviews Found
          </Typography>
        </Box>
      )}
    </Grid>
  );
}

export default UpdateReviews;
