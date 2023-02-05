import React from "react";
import { Link } from "react-router-dom";
import { Rating } from "@mui/material";

function ProductCard({
  id,
  name,
  price,
  ratings,
  numOfReviews,
  images,
  stock,
  createdAt,
}) {
  function extractDate(createdAt) {
    const date = new Date(createdAt);
    return date.toLocaleDateString();
  }
  // outputs: "May 23, 2022"
  const extractedDate = extractDate(createdAt);

  function isProductNew(extractedDate) {
    const now = new Date();
    const productAge = now - new Date(extractedDate);
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    return productAge < oneMonth;
  }
  const isNew = isProductNew(extractedDate);

  return (
    <Link to={`/product/${id}`}>
      <div className="w-80 flex justify-center items-center">
        <div className="w-full p-4">
          <div className="card flex flex-col justify-center p-10 bg-white rounded-lg shadow-2xl">
            <div className="prod-title mb-2">
              <p className="text-l uppercase text-gray-900 font-bold">{name}</p>
            </div>
            <div className="prod-img">
              <img
                alt=""
                src={images[0].url}
                className="w-full object-cover object-center"
              />
            </div>
            <div className="-ml-1 flex py-4 mb-2">
              <Rating
                name="half-rating-read"
                value={ratings}
                precision={0.5}
                readOnly
              />

              <span className="text-s ml-1 italic text-gray-400">
                ({numOfReviews} {numOfReviews > 1 ? "Reviews" : "Review"})
              </span>
            </div>
            <div className="prod-info grid gap-10">
              <div className="flex flex-col md:flex-row justify-between items-center text-gray-900">
                <p className="font-bold text-l m-auto">${price}</p>
                {stock === 0 && (
                  <span
                    className="text-xs inline-block py-1 px-2.5 leading-none text-center 
              whitespace-nowrap align-baseline font-semibold bg-gray-200 text-gray-700 rounded-full"
                  >
                    Out of Stock
                  </span>
                )}
                {isNew && (
                  <span
                    className="text-xs inline-block ml-1 py-1 px-2.5 leading-none text-center 
              whitespace-nowrap align-baseline font-semibold bg-green-200 text-green-700 rounded-full"
                  >
                    New
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
