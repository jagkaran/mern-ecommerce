class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    // Getting reference of quertStr but this could modify actual value of queryStr
    // const queryFilter = this.queryStr

    // Using the same with the help spread operator makes another copy without touching original
    const queryFilter = { ...this.queryStr };
    //console.log(`Before removing fields:`, queryFilter);

    // Remove some field for category
    const removeFields = ["keyword", "page", "limit"];

    removeFields.forEach((key) => delete queryFilter[key]);

    // Filter for Pricing and Ratings
    // console.log(`After removing fields:`, queryFilter);
    // console.log(`Before replacing fields:`, queryFilter);
    let queryStr = JSON.stringify(queryFilter);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    //console.log(`After replacing fields:`, queryStr);
    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    // Skip number of products to be shown on a particular page.
    // Ex: On first page skip=0, On second page skip=5 and so on
    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;
