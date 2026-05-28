"use strict";
/**
 * Unit tests for:
 *   - backend/utils/apiFeatures.js  (ApiFeatures)
 *   - backend/utils/transaction.js  (withRetry, withTransaction, withTransactionAndRetry)
 */

// ─── ApiFeatures ─────────────────────────────────────────────────────────────

const ApiFeatures = require("../utils/apiFeatures");

/**
 * Minimal chainable Mongoose query mock.
 * Records the last .find(), .limit(), and .skip() arguments.
 */
function mockQuery(initialDocs = []) {
  const q = {
    _docs:   initialDocs,
    _find:   null,
    _limit:  null,
    _skip:   null,
    find(filter)  { q._find  = filter; return q; },
    limit(n)      { q._limit = n;      return q; },
    skip(n)       { q._skip  = n;      return q; },
    // allow `await query` to resolve
    then(res, rej) { return Promise.resolve(q._docs).then(res, rej); },
  };
  return q;
}

describe("ApiFeatures.search()", () => {
  it("adds $regex filter when keyword is present", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, { keyword: "jersey" }).search();
    expect(api.query._find).toEqual({ name: { $regex: "jersey", $options: "i" } });
  });

  it("passes empty filter when keyword is absent", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, {}).search();
    expect(api.query._find).toEqual({});
  });

  it("is case-insensitive (options:i)", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, { keyword: "SHOE" }).search();
    expect(api.query._find.name.$options).toBe("i");
  });
});

describe("ApiFeatures.filter()", () => {
  it("strips keyword, page, limit before querying", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, { keyword: "shoe", page: "2", limit: "8", category: "sports" }).filter();
    expect(api.query._find).not.toHaveProperty("keyword");
    expect(api.query._find).not.toHaveProperty("page");
    expect(api.query._find).not.toHaveProperty("limit");
    expect(api.query._find).toHaveProperty("category", "sports");
  });

  it("converts gt/gte/lt/lte to MongoDB $ operators", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, { price: { gt: "100", lte: "500" } }).filter();
    expect(api.query._find).toEqual({ price: { $gt: "100", $lte: "500" } });
  });

  it("does not mutate the original queryStr", () => {
    const qs  = { keyword: "boot", page: "1", category: "footwear" };
    const q   = mockQuery();
    new ApiFeatures(q, qs).filter();
    expect(qs).toHaveProperty("keyword");
    expect(qs).toHaveProperty("page");
  });
});

describe("ApiFeatures.pagination()", () => {
  it("skips correct number of records for page 2", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, { page: "2" }).pagination(8);
    expect(api.query._limit).toBe(8);
    expect(api.query._skip).toBe(8);  // (2-1) * 8
  });

  it("defaults to page 1 when page is absent", () => {
    const q   = mockQuery();
    const api = new ApiFeatures(q, {}).pagination(8);
    expect(api.query._skip).toBe(0);
  });

  it("sets limit to resultPerPage", () => {
    const q   = mockQuery();
    new ApiFeatures(q, {}).pagination(12);
    expect(q._limit).toBe(12);
  });
});

describe("ApiFeatures.getFilter()", () => {
  it("returns filter object without pagination/search fields", () => {
    const q      = mockQuery();
    const api    = new ApiFeatures(q, { keyword: "x", page: "1", limit: "8", category: "sports" });
    const filter = api.getFilter();
    expect(filter).not.toHaveProperty("keyword");
    expect(filter).not.toHaveProperty("page");
    expect(filter).toHaveProperty("category", "sports");
  });

  it("converts operators in getFilter too", () => {
    const q      = mockQuery();
    const api    = new ApiFeatures(q, { price: { gte: "50" } });
    const filter = api.getFilter();
    expect(filter).toEqual({ price: { $gte: "50" } });
  });
});

describe("ApiFeatures — method chaining", () => {
  it("search().filter().pagination() all chain without errors", () => {
    const q   = mockQuery();
    expect(() => {
      new ApiFeatures(q, { keyword: "boot", page: "1", limit: "8", category: "footwear" })
        .search()
        .filter()
        .pagination(8);
    }).not.toThrow();
  });
});

// ─── withRetry ───────────────────────────────────────────────────────────────

const { withRetry, withTransaction, withTransactionAndRetry } = require("../utils/transaction");

describe("withRetry", () => {
  it("resolves immediately when operation succeeds on first attempt", async () => {
    const op = jest.fn().mockResolvedValue("ok");
    await expect(withRetry(op, { maxRetries: 2, delay: 0 })).resolves.toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries up to maxRetries times then throws", async () => {
    const err = new Error("transient");
    const op  = jest.fn().mockRejectedValue(err);
    await expect(withRetry(op, { maxRetries: 2, delay: 0, backoff: 1 })).rejects.toThrow("transient");
    expect(op).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("succeeds on second attempt (retry path)", async () => {
    let calls = 0;
    const op = jest.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) throw new Error("fail");
      return "recovered";
    });
    await expect(withRetry(op, { maxRetries: 3, delay: 0, backoff: 1 })).resolves.toBe("recovered");
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on ValidationError", async () => {
    const err  = Object.assign(new Error("bad data"), { name: "ValidationError" });
    const op   = jest.fn().mockRejectedValue(err);
    await expect(withRetry(op, { maxRetries: 3, delay: 0 })).rejects.toThrow("bad data");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on CastError", async () => {
    const err  = Object.assign(new Error("cast"), { name: "CastError" });
    const op   = jest.fn().mockRejectedValue(err);
    await expect(withRetry(op, { maxRetries: 3, delay: 0 })).rejects.toThrow("cast");
    expect(op).toHaveBeenCalledTimes(1);
  });
});

// ─── withTransaction ─────────────────────────────────────────────────────────
// We mock mongoose.startSession so no real DB is required for these tests.

const mongoose = require("mongoose");

describe("withTransaction", () => {
  let sessionMock;

  beforeEach(() => {
    sessionMock = {
      startTransaction:    jest.fn(),
      commitTransaction:   jest.fn().mockResolvedValue(undefined),
      abortTransaction:    jest.fn().mockResolvedValue(undefined),
      endSession:          jest.fn(),
    };
    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock);
  });

  afterEach(() => jest.restoreAllMocks());

  it("commits and returns the operation result on success", async () => {
    const result = await withTransaction(async (session) => {
      expect(session).toBe(sessionMock);
      return "done";
    });
    expect(result).toBe("done");
    expect(sessionMock.commitTransaction).toHaveBeenCalledTimes(1);
    expect(sessionMock.abortTransaction).not.toHaveBeenCalled();
    expect(sessionMock.endSession).toHaveBeenCalledTimes(1);
  });

  it("aborts and rethrows on error", async () => {
    await expect(
      withTransaction(async () => { throw new Error("db error"); })
    ).rejects.toThrow("db error");
    expect(sessionMock.abortTransaction).toHaveBeenCalledTimes(1);
    expect(sessionMock.commitTransaction).not.toHaveBeenCalled();
    expect(sessionMock.endSession).toHaveBeenCalledTimes(1);
  });
});

describe("withTransactionAndRetry", () => {
  let sessionMock;

  beforeEach(() => {
    sessionMock = {
      startTransaction:    jest.fn(),
      commitTransaction:   jest.fn().mockResolvedValue(undefined),
      abortTransaction:    jest.fn().mockResolvedValue(undefined),
      endSession:          jest.fn(),
    };
    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock);
  });

  afterEach(() => jest.restoreAllMocks());

  it("resolves when the operation succeeds", async () => {
    const result = await withTransactionAndRetry(
      async () => "tx-ok",
      { maxRetries: 1, delay: 0 }
    );
    expect(result).toBe("tx-ok");
  });

  it("retries transaction on transient error then succeeds", async () => {
    let attempt = 0;
    const result = await withTransactionAndRetry(
      async () => {
        attempt++;
        if (attempt < 2) throw new Error("write conflict");
        return "recovered";
      },
      { maxRetries: 3, delay: 0, backoff: 1 }
    );
    expect(result).toBe("recovered");
    expect(attempt).toBe(2);
  });
});
