import React, { useEffect } from "react";
import Banner from "./Banner";
import { getProduct } from "../../actions/productAction";
import { useSelector, useDispatch } from "react-redux";
import ProductGrid from "../Product/ProductGrid";
import { CircularProgress } from "@mui/material";
import { useAlert } from "react-alert";
import Copyright from "../Copyright";
import Seo from "../Seo";

function Home() {
  const alert = useAlert();
  const dispatch = useDispatch();

  const { loading, error, products } = useSelector((state) => state.product);

  useEffect(() => {
    if (error) {
      return alert.error(error);
    }
    dispatch(getProduct());
  }, [dispatch, error, alert]);

  return (
    <>
      <Seo
        title={
          "Shop Latest & Trendy | Shoes | Sports | Clothing | Accessories and much more"
        }
        description={
          "The Click.it Store has one of the largest selections of fashionable and trending products. Also shop for shoes, sports, clothing, accessories and more..."
        }
        path={"/"}
      />
      <Banner />
      {loading ? (
        <div className="grid place-items-center">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="bg-white">
            <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-800 text-center mb-2">
                Featured Products
              </h2>
              <ProductGrid products={products} />
            </div>
          </div>
        </>
      )}
      <Copyright />
    </>
  );
}

export default Home;
