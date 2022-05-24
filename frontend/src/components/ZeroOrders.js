import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";

function ZeroOrders() {
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
                src="/noorders.png"
                style={{
                  marginTop: 50,
                  display: "inline-block",
                  maxWidth: "100%",
                  width: 560,
                }}
              />
            </Box>
            <Typography align="center" color="textPrimary" variant="h3" mt={2}>
              No Orders Yet
            </Typography>
            <Typography
              align="center"
              color="textPrimary"
              variant="subtitle2"
              mt={2}
            >
              Looks like you haven't made your choice yet...
            </Typography>

            <Link to="/products">
              <Button
                startIcon={<ArrowBackIcon fontSize="small" />}
                sx={{ mt: 3 }}
                variant="outlined"
              >
                Start Shopping
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default ZeroOrders;
