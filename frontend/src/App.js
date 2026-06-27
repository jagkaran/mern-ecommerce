import { lazy, Suspense, useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { createTheme, ThemeProvider, CircularProgress, Box } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { loadUser } from "./actions/userAction";
import Header from "./components/Home/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Eagerly loaded — always needed on first paint
import Home from "./components/Home/Home";

// Lazy-loaded route chunks
const Products         = lazy(() => import("./components/Product/Products"));
const ProductDetailsV2 = lazy(() => import("./components/Product/PDP/ProductDetailsV2"));
const Search           = lazy(() => import("./components/Search"));
const Login            = lazy(() => import("./components/Login/Login"));
const Register         = lazy(() => import("./components/Login/Register"));
const Account          = lazy(() => import("./components/Account/Account"));
const UpdatePassword   = lazy(() => import("./components/Account/UpdatePassword"));
const ForgotPassword   = lazy(() => import("./components/Account/ForgotPassword"));
const ResetPassword    = lazy(() => import("./components/Account/ResetPassword"));
const Basket           = lazy(() => import("./components/Cart/Basket"));
const Shipping         = lazy(() => import("./components/Checkout/Shipping"));
const Success          = lazy(() => import("./components/Checkout/Success"));
const MyOrders         = lazy(() => import("./components/Order/MyOrders"));
const OrderDetails     = lazy(() => import("./components/Order/OrderDetails"));
const AboutUs          = lazy(() => import("./components/AboutUs"));
const NotFound         = lazy(() => import("./components/NotFound"));

// Admin chunk — only downloaded if user is admin
const Dashboard        = lazy(() => import("./components/Admin/DashBoard"));
const AllAdminOrders   = lazy(() => import("./components/Admin/AllOrders/AllAdminOrders"));
const AllAdminUsers    = lazy(() => import("./components/Admin/AllUsers/AllAdminUsers"));
const AllAdminProducts = lazy(() => import("./components/Admin/AllProducts/AllAdminProducts"));
const CreateProduct    = lazy(() => import("./components/Admin/AllProducts/CreateProduct"));
const UpdateProduct    = lazy(() => import("./components/Admin/AllProducts/UpdateProduct"));
const UpdateOrder      = lazy(() => import("./components/Admin/AllOrders/UpdateOrder"));
const UpdateUser       = lazy(() => import("./components/Admin/AllUsers/UpdateUser"));

const theme = createTheme({
  palette: {
    primary:   { main: grey[900] },
    secondary: { main: grey[800] },
    appBar:    { main: "#FFFFFF" },
  },
});

const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <CircularProgress color="inherit" />
  </Box>
);

// Module-level CSRF token — populated by GET /api/v1/csrf-token on mount.
// The csrf-csrf library's cookie contains "token|hash" (signed), but the
// X-CSRF-Token header must contain ONLY the raw token from the JSON body.
// Storing at module level ensures the interceptor always reads the latest value.
let _csrfToken = null;

function App() {
  const dispatch = useDispatch();
  const [stripeApiKey, setStripeApiKey] = useState("");
  const { isAuthenticated, loading } = useSelector((state) => state.user);

  // Backend uses double-submit cookie CSRF for state-mutating requests
  // (POST/PUT/DELETE/PATCH) outside NODE_ENV=test. The csrf-csrf library
  // sets a signed httpOnly cookie AND returns the raw token in the JSON body.
  // The cookie value is "token|hash" — NOT the raw token. So we MUST NOT read
  // the cookie for the header value; only the response body token is valid.
  useEffect(() => {
    axios.defaults.withCredentials = true;

    const requestInterceptor = axios.interceptors.request.use((config) => {
      const method = (config.method || "get").toLowerCase();
      const mutating = ["post", "put", "delete", "patch"].includes(method);
      if (mutating && _csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-Token"] = _csrfToken;
      }
      return config;
    });

    // Fetch token once on mount — stored at module level so it survives
    // across re-renders and is available to the interceptor immediately.
    axios
      .get("/api/v1/csrf-token")
      .then((res) => { _csrfToken = res.data.csrfToken; })
      .catch(() => {});

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, []);

  useEffect(() => { dispatch(loadUser()); }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    axios
      .get("/api/v1/getstripeapikey")
      .then(({ data }) => setStripeApiKey(data.stripeApiKey))
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    // bg-white on the outermost shell; NO overflow-y-auto here — that was
    // silently breaking `position:sticky`. Page-level scrolling happens on
    // <body> (the default), which is what the browser needs for sticky/fixed.
    <div className="bg-white min-h-screen">
      <Router>
        <ThemeProvider theme={theme}>
          {/* Fixed header — sits outside the scroll flow */}
          <Header />

          {/*
            pt-16 (64 px) on mobile / pt-20 (80 px) on sm+ matches the header
            heights defined in Header.js (h-16 / sm:h-20) so page content
            starts exactly below the header and nothing is hidden underneath it.
          */}
          <main className="pt-16 sm:pt-20">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetailsV2 />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:keyword" element={<Products />} />
                <Route path="/search" element={<Search />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/password/forgot" element={<ForgotPassword />} />
                <Route path="/cart" element={<Basket />} />
                <Route path="/aboutus" element={<AboutUs />} />
                <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} />}>
                  <Route path="/password/update" element={<UpdatePassword />} />
                  <Route
                    path="/shipping"
                    element={
                      stripeApiKey ? (
                        <Elements stripe={loadStripe(stripeApiKey)}>
                          <Shipping />
                        </Elements>
                      ) : (
                        <PageLoader />
                      )
                    }
                  />
                  <Route path="/account" element={<Account />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/myorders" element={<MyOrders />} />
                  <Route path="/order/:id" element={<OrderDetails />} />
                  <Route element={<AdminRoute isAuthenticated={isAuthenticated} loading={loading} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin/products" element={<AllAdminProducts />} />
                  <Route path="/admin/orders" element={<AllAdminOrders />} />
                  <Route path="/admin/users" element={<AllAdminUsers />} />
                  <Route path="/admin/product/new" element={<CreateProduct />} />
                  <Route path="/admin/product/update/:id" element={<UpdateProduct />} />
                  <Route path="/admin/user/update/:id" element={<UpdateUser />} />
                  <Route path="/admin/order/update/:id" element={<UpdateOrder />} />
                </Route>
                </Route>
                <Route path="/password/reset/:token" element={<ResetPassword />} />
                <Route path="/notfound" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/notfound" />} />
              </Routes>
            </Suspense>
          </main>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
