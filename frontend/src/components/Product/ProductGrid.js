import React from "react";
import ProductCard from "./ProductCard";

function ProductGrid({ products }) {
  return (
    // items-stretch (instead of place-items-center) makes every card in a
    // row stretch to the same height — the tallest card sets the row height
    // and every sibling card fills that height via h-full.
    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-6 items-stretch lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
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
