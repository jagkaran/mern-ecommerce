import React from "react";
import ProductCard from "./ProductCard";

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 place-items-center lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      {products &&
        products.map(
          ({
            _id,
            ratings,
            name,
            price,
            description,
            images,
            numOfReviews,
            stock,
            createdAt,
          }) => (
            <ProductCard
              key={_id}
              id={_id}
              ratings={ratings}
              name={name}
              price={price}
              description={description}
              images={images}
              numOfReviews={numOfReviews}
              stock={stock}
              createdAt={createdAt}
            />
          )
        )}
    </div>
  );
}

export default ProductGrid;
