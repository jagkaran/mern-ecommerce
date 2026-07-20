import React from "react";
import ProductCard from "./ProductCard";

function ProductGrid({ products }) {
return (
  <div
    style={{
      display: "grid",
      gap: 24,
    }}
    className="prod-grid"
  >
    {(products || []).map(
      (
        {
          _id,
          ratings,
          name,
          price,
          description,
          images,
          numOfReviews,
          stock,
          category,
          createdAt,
        },
        i
      ) => (
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
          category={category}
          createdAt={createdAt}
          isNew={i < 3}
        />
      )
    )}
  </div>
);
}

export default ProductGrid;
