import React, { Suspense, useContext, useEffect, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { TokenCSS } from "./design/tokens-css.jsx";
import theme from "./design/theme";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { loadUser } from "./actions/userAction";
import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import useCsrfToken from "./hooks/useCsrfToken";
import ToastHost from "./components/ToastHost";
import CurrencyProvider from "./utils/currencyContext.jsx";
import Home from "./components/Home/Home";

const PageLoader = () => (
  <div
    className="app-loader"
    style={{
      width: 32,
      height: 32,
      border: "2px solid var(--t-neutral-200)",
      borderTopColor: "var(--t-primary-600)",
      borderRadius: "50%",
      margin: "80px auto",
    }}
  />
);

// Stripe publishable key held in a module-level React Context so lazy route
// chunks (Checkout, Shipping) can wrap themselves in <Elements> without
// needing access to App's local state.
export const StripeKeyContext = React.createContext("");

// Wrapper component used by the lazy route loader. Consumes the Stripe key
// from context; renders <Elements> + children once the key arrives, otherwise
// the same PageLoader the previous v6 router used.
function StripeElementsGuard({ children }) {
  const stripeApiKey = useContext(StripeKeyContext);
  if (!stripeApiKey) return <PageLoader />;
  return <Elements stripe={loadStripe(stripeApiKey)}>{children}</Elements>;
}

// ─── Route config (RR v7 data router) ──────────────────────────────────────
// `lazy:` lets Vite split each route into its own chunk — same behaviour as
// the previous React.lazy() wrapper. Each loader returns either a plain
// component or (for Stripe-using routes) a wrapper component that consumes
// StripeKeyContext.
const stripeLazy = (loader) => async () => {
  const mod = await loader();
  const Inner = mod.default;
  return {
    Component: () => <StripeElementsGuard><Inner /></StripeElementsGuard>,
  };
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "product/:id", lazy: () => import("./components/Product/PDP/ProductDetailsV2") },
      { path: "products", lazy: () => import("./components/Product/Products") },
      { path: "products/:keyword", lazy: () => import("./components/Product/Products") },
      { path: "search", lazy: () => import("./components/Search") },
      { path: "wishlist", lazy: () => import("./components/Wishlist") },
      { path: "signin", lazy: () => import("./components/Login/Login") },
      { path: "signup", lazy: () => import("./components/Login/Register") },
      { path: "password/forgot", lazy: () => import("./components/Account/ForgotPassword") },
      { path: "cart", lazy: () => import("./components/Cart/Basket") },
      { path: "checkout", lazy: stripeLazy(() => import("./components/Checkout/CheckoutPage")) },
      { path: "aboutus", lazy: () => import("./components/AboutUs") },
      {
        // Lives OUTSIDE ProtectedRoute — a guest who just placed an order
        // must be able to land here. Success page itself guards content
        // via the claim token in the query string.
        path: "success",
        lazy: () => import("./components/Checkout/Success"),
      },
      {
        element: <ProtectedLayout />,
        children: [
          { path: "password/update", lazy: () => import("./components/Account/UpdatePassword") },
          { path: "account", lazy: () => import("./components/Account/Account") },
          { path: "myorders", lazy: () => import("./components/Order/MyOrders") },
          { path: "order/:id", lazy: () => import("./components/Order/OrderDetails") },
          { path: "shipping", lazy: stripeLazy(() => import("./components/Checkout/Shipping")) },
          {
            element: <AdminLayout />,
            children: [
              { path: "dashboard", lazy: () => import("./components/Admin/DashBoard") },
              { path: "admin/products", lazy: () => import("./components/Admin/AllProducts/AllAdminProducts") },
              { path: "admin/orders", lazy: () => import("./components/Admin/AllOrders/AllAdminOrders") },
              { path: "admin/users", lazy: () => import("./components/Admin/AllUsers/AllAdminUsers") },
              { path: "admin/coupons", lazy: () => import("./components/Admin/AllCoupons/AllAdminCoupons") },
              { path: "admin/coupon/new", lazy: () => import("./components/Admin/AllCoupons/CreateCoupon") },
              { path: "admin/coupon/update/:id", lazy: () => import("./components/Admin/AllCoupons/UpdateCoupon") },
              { path: "admin/product/new", lazy: () => import("./components/Admin/AllProducts/CreateProduct") },
              { path: "admin/product/update/:id", lazy: () => import("./components/Admin/AllProducts/UpdateProduct") },
              { path: "admin/user/update/:id", lazy: () => import("./components/Admin/AllUsers/UpdateUser") },
              { path: "admin/order/update/:id", lazy: () => import("./components/Admin/AllOrders/UpdateOrder") },
            ],
          },
        ],
      },
      { path: "password/reset/:token", lazy: () => import("./components/Account/ResetPassword") },
      { path: "notfound", lazy: () => import("./components/NotFound") },
      { path: "*", element: <Navigate to="/notfound" replace /> },
    ],
  },
]);

// Root layout — wraps every route. Hosts the app shell and the Suspense
// boundary for lazy chunks. Children render via <Outlet />.
function RootLayout() {
  return (
    <CurrencyProvider>
      <div className="bg-white min-h-screen">
        <ThemeProvider theme={theme}>
          <TokenCSS />
          <Header />
          <main
            id="main"
            tabIndex={-1}
            style={{ paddingTop: "calc(var(--t-headerHeight) + 1.5rem)", outline: "none" }}
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
          <Footer />
          <ToastHost />
        </ThemeProvider>
      </div>
    </CurrencyProvider>
  );
}

// Layout components for nested route trees. They render <Outlet /> so child
// routes can mount. They wrap ProtectedRoute / AdminRoute so the guard
// component (which receives isAuthenticated + loading as props) can drive
// redirects.
function ProtectedLayout() {
  const { isAuthenticated, loading } = useSelector((state) => state.user);
  return (
    <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
      <Outlet />
    </ProtectedRoute>
  );
}

function AdminLayout() {
  const { isAuthenticated, loading } = useSelector((state) => state.user);
  return (
    <AdminRoute isAuthenticated={isAuthenticated} loading={loading}>
      <Outlet />
    </AdminRoute>
  );
}


function App() {
  const dispatch = useDispatch();
  const [stripeApiKey, setStripeApiKey] = useState("");
  const { isAuthenticated, loading } = useSelector((state) => state.user);
  useCsrfToken();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    axios
      .get("/api/v1/getstripeapikey")
      .then(({ data }) => setStripeApiKey(data.stripeApiKey))
      .catch(() => {});
  }, []);

  return (
    <StripeKeyContext.Provider value={stripeApiKey}>
      <RouterProvider router={router} />
    </StripeKeyContext.Provider>
  );
}

export default App;
