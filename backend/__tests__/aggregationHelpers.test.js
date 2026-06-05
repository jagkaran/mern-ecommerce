"use strict";
/**
 * Unit tests for backend/utils/aggregationHelpers.js
 * Pure functions — no DB or external I/O required.
 */

const { recalculateRatings, productWithReviews, reviewsWithUserInfo } =
  require("../utils/aggregationHelpers");

describe("recalculateRatings", () => {
  it("returns 0 ratings and 0 reviews for an empty array", () => {
    const result = recalculateRatings([]);
    expect(result.ratings).toBe(0);
    expect(result.numOfReviews).toBe(0);
  });

  it("returns exact rating for a single review", () => {
    const reviews = [{ rating: 4 }];
    const result = recalculateRatings(reviews);
    expect(result.ratings).toBe(4);
    expect(result.numOfReviews).toBe(1);
  });

  it("averages multiple ratings", () => {
    const reviews = [
      { rating: 3 },
      { rating: 4 },
      { rating: 5 },
    ];
    const result = recalculateRatings(reviews);
    expect(result.numOfReviews).toBe(3);
    expect(result.ratings).toBeCloseTo(4);
  });

  it("handles zero-star reviews", () => {
    const reviews = [{ rating: 0 }, { rating: 5 }];
    const result = recalculateRatings(reviews);
    expect(result.numOfReviews).toBe(2);
    expect(result.ratings).toBeCloseTo(2.5);
  });
});

describe("productWithReviews", () => {
  it("returns an array of aggregation stages", () => {
    const stages = productWithReviews();
    expect(Array.isArray(stages)).toBe(true);
    expect(stages.length).toBeGreaterThanOrEqual(2);
  });

  it("stages contain $lookup, $addFields, and $project", () => {
    const stages = productWithReviews();
    const types = stages.map((s) => Object.keys(s)[0]);
    expect(types).toContain("$lookup");
    expect(types).toContain("$addFields");
    expect(types).toContain("$project");
  });
});

describe("reviewsWithUserInfo", () => {
  it("returns an array with $lookup and $unwind", () => {
    const stages = reviewsWithUserInfo();
    const types = stages.map((s) => Object.keys(s)[0]);
    expect(types).toContain("$lookup");
    expect(types).toContain("$unwind");
  });
});
