/**
 * ApiFeatures — chainable query builder for Product listings.
 *
 * Usage:
 *   const api = new ApiFeatures(Product.find(), req.query)
 *     .search()
 *     .filter();
 *   const products = await api.query;
 *   api.pagination(8);
 *   const paginated = await api.query.clone();
 */
class ApiFeatures {
  constructor(query, queryStr) {
    this.query    = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? { name: { $regex: this.queryStr.keyword, $options: "i" } }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    // Spread to avoid mutating the original queryStr reference
    const queryFilter = { ...this.queryStr };

    // Strip pagination / search / sort fields before passing to MongoDB.
    // `sort` is handled separately by the controller via SORT_MAP — leaving
    // it here would turn e.g. ?sort=price-asc into a Mongo filter criterion
    // that matches nothing (Product schema has no `sort` field).
    ["keyword", "page", "limit", "sort"].forEach((key) => delete queryFilter[key]);

    // Convert gt/gte/lt/lte to MongoDB $ operators
    let queryStr = JSON.stringify(queryFilter);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Get the filter object for counting
   * @returns {Object} The filter object
   */
  getFilter() {
    const queryFilter = { ...this.queryStr };

    // Strip pagination / search / sort fields before passing to MongoDB.
    // See filter() above for why `sort` is in this list.
    ["keyword", "page", "limit", "sort"].forEach((key) => delete queryFilter[key]);

    // Convert gt/gte/lt/lte to MongoDB $ operators
    let queryStr = JSON.stringify(queryFilter);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    return JSON.parse(queryStr);
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip        = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;
