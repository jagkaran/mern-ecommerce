import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

function ProtectedRoute({ children, isAuthenticated, loading }) {
  const location = useLocation();

  if (loading !== false) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
