import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { CircularProgress, Box } from "@mui/material";

function AdminRoute({ children, isAuthenticated, loading }) {
  const location = useLocation();
  const { user } = useSelector((s) => s.user);

  if (loading !== false) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/account" replace />;
  }

  return children ? children : <Outlet />;
}

export default AdminRoute;
