import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Rating,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getProduct } from "../../actions/productAction";
import Copyright from "../Copyright";
import ProductGrid from "./ProductGrid";
import StarIcon from "@mui/icons-material/Star";
import Seo from "../Seo";

const categories = [
  {
    id: 1,
    name: "laptop",
  },
  {
    id: 2,
    name: "footwear",
  },
  {
    id: 3,
    name: "bottom",
  },
  {
    id: 4,
    name: "clothing",
  },
  {
    id: 5,
    name: "tops",
  },
  {
    id: 6,
    name: "shoes",
  },
  {
    id: 7,
    name: "camera",
  },
  {
    id: 8,
    name: "smartphones",
  },
  {
    id: 9,
    name: "accessories",
  },
];

const ratingLabels = {
  1: "Useless",

  2: "Poor",

  3: "Ok",

  4: "Good",

  5: "Excellent",
};

function valuetext(value) {
  return `${value}°`;
}

function Products() {
  const alert = useAlert();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [price, setPrice] = useState([1, 5000]);
  const [priceRange, setPriceRange] = useState([1, 5000]);
  const [category, setCategory] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(-1);

  const {
    loading,
    error,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  } = useSelector((state) => state.product);

  const { keyword } = useParams();

  const numberOfPages = Math.floor(
    (filteredProductsCount + resultPerPage - 1) / resultPerPage
  );

  const priceHandler = (e, newPrice) => {
    setPrice(newPrice);
  };

  const priceRangeHandler = () => {
    setPriceRange(price);
  };

  const setCurrentPageNo = (e, value) => {
    setCurrentPage(value);
  };

  const handleChangeCategory = (event) => {
    setCategory(event.target.value);
  };

  useEffect(() => {
    if (error) {
      return alert.error(error);
    }
    dispatch(
      getProduct(keyword, currentPage, priceRange, category, ratingValue)
    );
  }, [
    dispatch,
    error,
    alert,
    keyword,
    currentPage,
    priceRange,
    category,
    ratingValue,
  ]);

  return (
    <>
      <Seo
        title="New and Trendy Product Store"
        description="Looking for a&nbsp;New and Trendy Products&nbsp;to add to your quiver? The Click.it store has one of the largest selections of new and trendy products on the planet. Choose from&nbsp;clothing,&nbsp;shoes,&nbsp;accessories,&nbsp;and&nbsp;much more."
        path="/products"
      />
      {loading ? (
        <div className="grid place-items-center">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="bg-white">
            <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-800 text-left">
                All Products ({productsCount})
              </h2>
              <div className="flex flex-col items-center justify-around p-4 sm:flex-row  bg-gray-100 mt-2 mb-2 border-1 rounded-lg">
                <div className="ml-4 w-36">
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    Price{" "}
                    <span className="text-xs">
                      ({priceRange[0]} to {priceRange[1]})
                    </span>
                  </Typography>
                  <Slider
                    value={price}
                    onChange={priceHandler}
                    onChangeCommitted={priceRangeHandler}
                    valueLabelDisplay="auto"
                    aria-labelledby="range-slider"
                    getAriaValueText={valuetext}
                    min={0}
                    max={5000}
                  />
                </div>
                <div className="ml-6 w-40 mt-6 sm:mt-0">
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Category
                    </InputLabel>
                    <Select
                      labelId="category-select-label"
                      id="category-select"
                      label="Category"
                      value={category}
                      onChange={handleChangeCategory}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          <span className="capitalize">{category.name}</span>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="ml-4 mt-6 sm:mt-0">
                  <Stack spacing={1}>
                    <Typography
                      sx={{
                        textAlign: "center",
                      }}
                    >
                      Ratings
                    </Typography>
                    <div className="flex flex-col items-center sm:flex-row">
                      <Rating
                        name="hover-feedback"
                        value={ratingValue}
                        onChange={(event, newRatingValue) => {
                          setRatingValue(newRatingValue);
                        }}
                        onChangeActive={(event, newHover) => {
                          setRatingHover(newHover);
                        }}
                        size="large"
                        emptyIcon={
                          <StarIcon
                            style={{ opacity: 0.55 }}
                            fontSize="inherit"
                          />
                        }
                      />
                      {ratingValue !== null && (
                        <span className="ml-4">
                          {
                            ratingLabels[
                              ratingHover !== -1 ? ratingHover : ratingValue
                            ]
                          }
                        </span>
                      )}
                    </div>
                  </Stack>
                </div>
              </div>
              <ProductGrid products={products} />
              {resultPerPage < filteredProductsCount && (
                <div className="mt-10">
                  <Pagination
                    count={numberOfPages}
                    onChange={setCurrentPageNo}
                    page={currentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <Copyright />
    </>
  );
}

export default Products;
