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
  const extractedDate = extractDate(createdAt);

  function isProductNew(extractedDate) {
    const now = new Date();
    const productAge = now - new Date(extractedDate);
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    return productAge < oneMonth;
  }
  const isNew = isProductNew(extractedDate);

  return (
    // h-full ensures the Link/wrapper stretches to fill the grid cell height
    <Link to={`/product/${id}`} className="h-full w-full">
      <div className="h-full p-4">
        {/* flex-col + h-full makes every card the same height in a row */}
        <div className="card flex flex-col h-full p-6 bg-white rounded-lg shadow-2xl">

          {/* Product name — fixed area at top */}
          <div className="prod-title mb-3">
            <p className="text-sm uppercase text-gray-900 font-bold leading-snug">
              {name}
            </p>
          </div>

          {/* Image — fixed height so all images occupy identical space */}
          <div className="prod-img h-52 w-full overflow-hidden rounded">
            <img
              alt={name}
              src={images[0].url}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Rating */}
          <div className="-ml-1 flex items-center py-4">
            <Rating
              name="half-rating-read"
              value={ratings}
              precision={0.5}
              readOnly
            />
            <span className="text-xs ml-1 italic text-gray-400">
              ({numOfReviews} {numOfReviews > 1 ? "Reviews" : "Review"})
            </span>
          </div>

          {/* Price + badges — mt-auto pushes this to the bottom of every card */}
          <div className="prod-info mt-auto">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-gray-900">${price}</p>
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
                  className="text-xs inline-block py-1 px-2.5 leading-none text-center
                    whitespace-nowrap align-baseline font-semibold bg-green-200 text-green-700 rounded-full"
                >
                  New
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
