import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";

function EmptyCart() {
  return (
    <>
      <Box
        component="main"
        sx={{
          alignItems: "center",
          display: "flex",
          flexGrow: 1,
          minHeight: "100%",
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <img
                alt="Empty Cart"
                src="/empty-cart-blue.png"
                style={{
                  marginTop: 50,
                  display: "inline-block",
                  maxWidth: "100%",
                  width: 560,
                }}
              />
            </Box>
            <Typography align="center" color="textPrimary" variant="h3">
              Unfortunately, Your Cart is Empty
            </Typography>
            <Typography
              align="center"
              color="textPrimary"
              variant="subtitle2"
              mt={2}
            >
              Please Add Something in your Cart
            </Typography>

            <Link to="/products">
              <Button
                startIcon={<ArrowBackIcon fontSize="small" />}
                sx={{ mt: 3 }}
                variant="outlined"
              >
                Continue Shopping
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default EmptyCart;
