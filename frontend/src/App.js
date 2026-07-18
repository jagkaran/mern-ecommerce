import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { TokenCSS } from "./design/tokens-css";
import theme from "./design/theme";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { loadUser } from "./actions/userAction";
import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import useCsrfToken from "./hooks/useCsrfToken";
import ToastHost from "./components/ToastHost";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CurrencyProvider from "./utils/currencyContext";

// Eagerly loaded — always needed on first paint
import Home from "./components/Home/Home";

// Lazy-loaded route chunks
const Products = lazy(() => import("./components/Product/Products"));
const ProductDetailsV2 = lazy(() => import("./components/Product/PDP/ProductDetailsV2"));
const Search = lazy(() => import("./components/Search"));
const Wishlist = lazy(() => import("./components/Wishlist"));
const Login = lazy(() => import("./components/Login/Login"));
const Register = lazy(() => import("./components/Login/Register"));
const Account = lazy(() => import("./components/Account/Account"));
const UpdatePassword = lazy(() => import("./components/Account/UpdatePassword"));
const ForgotPassword = lazy(() => import("./components/Account/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/Account/ResetPassword"));
const Basket = lazy(() => import("./components/Cart/Basket"));
const Shipping = lazy(() => import("./components/Checkout/Shipping"));
const Checkout = lazy(() => import("./components/Checkout/CheckoutPage"));
const Success = lazy(() => import("./components/Checkout/Success"));
const MyOrders = lazy(() => import("./components/Order/MyOrders"));
const OrderDetails = lazy(() => import("./components/Order/OrderDetails"));
const AboutUs = lazy(() => import("./components/AboutUs"));
const NotFound = lazy(() => import("./components/NotFound"));

// Admin chunk — only downloaded if user is admin
const Dashboard = lazy(() => import("./components/Admin/DashBoard"));
const AllAdminOrders = lazy(() => import("./components/Admin/AllOrders/AllAdminOrders"));
const AllAdminUsers = lazy(() => import("./components/Admin/AllUsers/AllAdminUsers"));
const AllAdminProducts = lazy(() => import("./components/Admin/AllProducts/AllAdminProducts"));
const CreateProduct = lazy(() => import("./components/Admin/AllProducts/CreateProduct"));
const UpdateProduct = lazy(() => import("./components/Admin/AllProducts/UpdateProduct"));
const AllAdminCoupons = lazy(() => import("./components/Admin/AllCoupons/AllAdminCoupons"));
const CreateCoupon = lazy(() => import("./components/Admin/AllCoupons/CreateCoupon"));
const UpdateCoupon = lazy(() => import("./components/Admin/AllCoupons/UpdateCoupon"));
const UpdateOrder = lazy(() => import("./components/Admin/AllOrders/UpdateOrder"));
const UpdateUser = lazy(() => import("./components/Admin/AllUsers/UpdateUser"));

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

// Module-level CSRF token — REMOVED. The per-instance hook below owns the
// token's lifetime and avoids singleton races under HMR / StrictMode.

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
    <CurrencyProvider>
      <div className="bg-white min-h-screen">
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider theme={theme}>
            <TokenCSS />
            <Header />
            <main
              id="main"
              tabIndex={-1}
              style={{ paddingTop: "calc(var(--t-headerHeight) + 1.5rem)", outline: "none" }}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetailsV2 />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:keyword" element={<Products />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/signin" element={<Login />} />
                  <Route path="/signup" element={<Register />} />
                  <Route path="/password/forgot" element={<ForgotPassword />} />
                  <Route path="/cart" element={<Basket />} />
                  <Route
                    path="/checkout"
                    element={
                      stripeApiKey ? (
                        <Elements stripe={loadStripe(stripeApiKey)}>
                          <Checkout />
                        </Elements>
                      ) : (
                        <PageLoader />
                      )
                    }
                  />
                  <Route path="/aboutus" element={<AboutUs />} />
                  {/* /success lives OUTSIDE the ProtectedRoute block — a guest who just
    placed an order must be able to land here. The Success page itself
    guards its content via the claim token (params.get("token")) and the
    presence of an authenticated user; the page just needs to be reachable. */}
                  <Route path="/success" element={<Success />} />
                  <Route
                    element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} />}
                  >
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
                    <Route path="/myorders" element={<MyOrders />} />
                    <Route path="/order/:id" element={<OrderDetails />} />
                    <Route
                      element={<AdminRoute isAuthenticated={isAuthenticated} loading={loading} />}
                    >
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/admin/products" element={<AllAdminProducts />} />
                      <Route path="/admin/orders" element={<AllAdminOrders />} />
                      <Route path="/admin/users" element={<AllAdminUsers />} />
                      <Route path="/admin/coupons" element={<AllAdminCoupons />} />
                      <Route path="/admin/coupon/new" element={<CreateCoupon />} />
                      <Route path="/admin/coupon/update/:id" element={<UpdateCoupon />} />
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
            <Footer />
            <ToastHost />
          </ThemeProvider>
        </Router>
      </div>
    </CurrencyProvider>
  );
}

export default App;
