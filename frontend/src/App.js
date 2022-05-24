import Home from "./components/Home/Home";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Header from "./components/Home/Header";
import Products from "./components/Product/Products";
import Search from "./components/Search";
import Register from "./components/Login/Register";
import Login from "./components/Login/Login";
import { createTheme, ThemeProvider } from "@mui/material";
import { grey } from "@mui/material/colors";
import Account from "./components/Account/Account";
import { useEffect, useState } from "react";
import { loadUser } from "./actions/userAction";
import UpdatePassword from "./components/Account/UpdatePassword";
import { useDispatch, useSelector } from "react-redux";
import ForgotPassword from "./components/Account/ForgotPassword";
import ResetPassword from "./components/Account/ResetPassword";
import Basket from "./components/Cart/Basket";
import NotFound from "./components/NotFound";
import Shipping from "./components/Checkout/Shipping";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ProtectedRoute from "./components/ProtectedRoute";
import Success from "./components/Checkout/Success";
import MyOrders from "./components/Order/MyOrders";
import OrderDetails from "./components/Order/OrderDetails";
import Dashboard from "./components/Admin/DashBoard";
import AllAdminOrders from "./components/Admin/AllOrders/AllAdminOrders";
import AllAdminUsers from "./components/Admin/AllUsers/AllAdminUsers";
import AllAdminProducts from "./components/Admin/AllProducts/AllAdminProducts";
import CreateProduct from "./components/Admin/AllProducts/CreateProduct";
import UpdateProduct from "./components/Admin/AllProducts/UpdateProduct";
import UpdateOrder from "./components/Admin/AllOrders/UpdateOrder";
import UpdateUser from "./components/Admin/AllUsers/UpdateUser";
import ProductDetailsV2 from "./components/Product/PDP/ProductDetailsV2";
import AboutUs from "./components/AboutUs";

const theme = createTheme({
  palette: {
    primary: {
      main: grey[900],
    },
    secondary: {
      main: grey[800],
    },
    appBar: {
      main: "#FFFFFF",
    },
  },
});

function App() {
  const dispatch = useDispatch();
  const [stripeApiKey, setStripeApiKey] = useState("");

  async function getStripeApiKey() {
    const { data } = await axios.get("/api/v1/getstripeapikey");
    setStripeApiKey(data.stripeApiKey);
  }
  const { isAuthenticated, user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadUser());
    getStripeApiKey();
  }, [dispatch]);

  return (
    <div className="bg-gray-100">
      <main className="dark:bg-gray-800 bg-white mx-auto overflow-y-auto">
        <Router>
          <ThemeProvider theme={theme}>
            <Header />
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
              {/* Protected Routes. Ex: It will check if the user is logged in*/}
              <Route
                element={<ProtectedRoute isAuthenticated={isAuthenticated} />}
              >
                <Route path="/password/update" element={<UpdatePassword />} />
                <Route
                  path="/shipping"
                  element={
                    stripeApiKey && (
                      <Elements stripe={loadStripe(stripeApiKey)}>
                        <Shipping />
                      </Elements>
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
                  element={
                    user?.role === "admin" ? <AllAdminProducts /> : <Account />
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    user?.role === "admin" ? <AllAdminOrders /> : <Account />
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    user?.role === "admin" ? <AllAdminUsers /> : <Account />
                  }
                />
                <Route
                  path="/admin/product/new"
                  element={
                    user?.role === "admin" ? <CreateProduct /> : <Account />
                  }
                />

                <Route
                  path="/admin/product/update/:id"
                  element={
                    user?.role === "admin" ? <UpdateProduct /> : <Account />
                  }
                />
                <Route
                  path="/admin/user/update/:id"
                  element={
                    user?.role === "admin" ? <UpdateUser /> : <Account />
                  }
                />
                <Route
                  path="/admin/order/update/:id"
                  element={
                    user?.role === "admin" ? <UpdateOrder /> : <Account />
                  }
                />
              </Route>
              ){/* End of Protected Routes */}
              <Route
                path="/password/reset/:token"
                element={<ResetPassword />}
              />
              <Route path="*" element={<Navigate to="/notfound" />} />
              <Route path="/notfound" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </Router>
      </main>
    </div>
  );
}

export default App;
