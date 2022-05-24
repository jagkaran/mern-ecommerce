import React from "react";
import { Outlet } from "react-router-dom";
import Login from "./Login/Login";

function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) {
    return <Login />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
