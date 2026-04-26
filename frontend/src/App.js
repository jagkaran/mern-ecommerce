import { lazy, Suspense, useEffect, useState } from "react";
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
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Eagerly loaded — always needed on first paint
import Home from "./components/Home/Home";

// Lazy-loaded route chunks
const Products = lazy(() => import("./components/Product/Products"));
const ProductDetailsV2 = lazy(() => import("./components/Product/PDP/ProductDetailsV2"));
const Search = lazy(() => import("./components/Search"));
const Login = lazy(() => import("./components/Login/Login"));
const Register = lazy(() => import("./components/Login/Register"));
const Account = lazy(() => import("./components/Account/Account"));
const UpdatePassword = lazy(() => import("./components/Account/UpdatePassword"));
const ForgotPassword = lazy(() => import("./components/Account/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/Account/ResetPassword"));
const Basket = lazy(() => import("./components/Cart/Basket"));
const Shipping = lazy(() => import("./components/Checkout/Shipping"));
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
const UpdateOrder = lazy(() => import("./components/Admin/AllOrders/UpdateOrder"));
const UpdateUser = lazy(() => import("./components/Admin/AllUsers/UpdateUser"));

const theme = createTheme({
  palette: {
    primary: { main: grey[900] },
    secondary: { main: grey[800] },
    appBar: { main: "#FFFFFF" },
  },
});

const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <CircularProgress color="inherit" />
  </Box>
);

function App() {
  const dispatch = useDispatch();
  const [stripeApiKey, setStripeApiKey] = useState("");
  const { isAuthenticated, user } = useSelector((state) => state.user);

  // Load the current user session on mount.
  // A 401 here is expected for unauthenticated visitors — Redux handles
  // it gracefully by setting isAuthenticated: false.
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Fetch the Stripe publishable key only after the user is authenticated.
  // The /getstripeapikey endpoint requires a valid session cookie, so calling
  // it before login always returns 401. Splitting into a separate effect
  // also prevents an unhandled rejection from crashing the app for visitors.
  useEffect(() => {
    if (!isAuthenticated) return;
    axios
      .get("/api/v1/getstripeapikey")
      .then(({ data }) => setStripeApiKey(data.stripeApiKey))
      .catch(() => {
        // Stripe key unavailable — /shipping will show a loader until
        // a subsequent successful fetch or page reload after login.
      });
  }, [isAuthenticated]);

  return (
    <div className="bg-gray-100">
      <main className="dark:bg-gray-800 bg-white mx-auto overflow-y-auto">
        <Router>
          <ThemeProvider theme={theme}>
            <Header />
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
                <Route
                  element={<ProtectedRoute isAuthenticated={isAuthenticated} />}
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
                  <Route path="/success" element={<Success />} />
                  <Route path="/myorders" element={<MyOrders />} />
                  <Route path="/order/:id" element={<OrderDetails />} />
                  <Route
                    path="/dashboard"
                    element={user?.role === "admin" ? <Dashboard /> : <Account />}
                  />
                  <Route
                    path="/admin/products"
                    element={user?.role === "admin" ? <AllAdminProducts /> : <Account />}
                  />
                  <Route
                    path="/admin/orders"
                    element={user?.role === "admin" ? <AllAdminOrders /> : <Account />}
                  />
                  <Route
                    path="/admin/users"
                    element={user?.role === "admin" ? <AllAdminUsers /> : <Account />}
                  />
                  <Route
                    path="/admin/product/new"
                    element={user?.role === "admin" ? <CreateProduct /> : <Account />}
                  />
                  <Route
                    path="/admin/product/update/:id"
                    element={user?.role === "admin" ? <UpdateProduct /> : <Account />}
                  />
                  <Route
                    path="/admin/user/update/:id"
                    element={user?.role === "admin" ? <UpdateUser /> : <Account />}
                  />
                  <Route
                    path="/admin/order/update/:id"
                    element={user?.role === "admin" ? <UpdateOrder /> : <Account />}
                  />
                </Route>
                <Route path="/password/reset/:token" element={<ResetPassword />} />
                <Route path="/notfound" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/notfound" />} />
              </Routes>
            </Suspense>
          </ThemeProvider>
        </Router>
      </main>
    </div>
  );
}

export default App;
