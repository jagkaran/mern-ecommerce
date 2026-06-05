const mongoose = require("mongoose");

/**
 * Recalculate ratings and numOfReviews from a reviews array.
 * Shared by createProductReview and deleteProductReview so the math
 * lives in one place.
 */
function recalculateRatings(reviews) {
  const numOfReviews = reviews.length;
  const ratings = numOfReviews === 0
    ? 0
    : reviews.reduce((sum, r) => sum + r.rating, 0) / numOfReviews;
  return { ratings, numOfReviews };
}

/**
 * Aggregation stages to join a product with its reviews.
 * Append to any Product.aggregate() pipeline.
 *
 * @returns {object[]} pipeline stages
 */
function productWithReviews() {
  return [
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "reviews",
      },
    },
    {
      $addFields: {
        numOfReviews: { $size: "$reviews" },
        ratings: {
          $cond: [
            { $eq: [{ $size: "$reviews" }, 0] },
            0,
            { $avg: "$reviews.rating" },
          ],
        },
      },
    },
    { $project: { reviews: 0 } },
  ];
}

/**
 * Aggregation stages to join reviews with their author's user info.
 * Append inside the $lookup pipeline for the reviews sub-array.
 *
 * @returns {object[]} pipeline stages
 */
function reviewsWithUserInfo() {
  return [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        "user.name": "$user.name",
        "user.profilePic": "$user.profilePic",
      },
    },
  ];
}

module.exports = {
  recalculateRatings,
  productWithReviews,
  reviewsWithUserInfo,
};
