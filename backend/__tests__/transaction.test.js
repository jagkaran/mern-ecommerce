"use strict";
/**
 * Transaction utility tests — covers the 4 branches in utils/transaction.js
 * that were previously untested:
 *
 *   1. withTransaction  — operation throws → abortTransaction fires
 *   2. withTransaction  — happy path commits + ends session
 *   3. withRetry        — ValidationError/CastError short-circuit (no retry)
 *   4. withRetry        — non-retryable error after maxRetries → throws last
 *
 * ponytail: don't mock mongoose.startSession at the module level — just
 * spy on it. The real session has the right API surface for the unit
 * under test and stays honest about what gets called.
 */

const mongoose = require("mongoose");
const { withTransaction, withRetry } = require("../utils/transaction");

/**
 * Build a fake session that records method calls. Matches the slice of the
 * real Mongoose session API that withTransaction actually uses:
 *   startTransaction, commitTransaction, abortTransaction, endSession.
 */
function makeFakeSession() {
  const calls = { commit: 0, abort: 0, end: 0 };
  return {
    calls,
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockImplementation(() => {
      calls.commit += 1;
    }),
    abortTransaction: jest.fn().mockImplementation(() => {
      calls.abort += 1;
    }),
    endSession: jest.fn().mockImplementation(() => {
      calls.end += 1;
    }),
  };
}

describe("withTransaction", () => {
  it("commits + ends session on happy path; returns op result", async () => {
    // Arrange
    const session = makeFakeSession();
    const startSessionSpy = jest.spyOn(mongoose, "startSession").mockResolvedValue(session);

    // Act
    const result = await withTransaction(async (s) => {
      expect(s).toBe(session); // op receives the same session
      return { ok: true, value: 42 };
    });

    // Assert
    expect(result).toEqual({ ok: true, value: 42 });
    expect(session.startTransaction).toHaveBeenCalledTimes(1);
    expect(session.calls.commit).toBe(1);
    expect(session.calls.abort).toBe(0);
    expect(session.calls.end).toBe(1);

    startSessionSpy.mockRestore();
  });

  it("aborts + ends session + rethrows when operation throws", async () => {
    // Arrange
    const session = makeFakeSession();
    const startSessionSpy = jest.spyOn(mongoose, "startSession").mockResolvedValue(session);
    const boom = new Error("op failed");

    // Act + Assert
    await expect(
      withTransaction(async () => {
        throw boom;
      })
    ).rejects.toBe(boom);

    expect(session.calls.commit).toBe(0);
    expect(session.calls.abort).toBe(1);
    expect(session.calls.end).toBe(1);

    startSessionSpy.mockRestore();
  });

  it("endSession runs even when commitTransaction itself throws", async () => {
    // ponytail: defensive guarantee — the finally block must always release
    // the session. If commit throws, the session is still .end()ed.
    const session = makeFakeSession();
    session.commitTransaction.mockRejectedValueOnce(new Error("commit flaky"));
    const startSessionSpy = jest.spyOn(mongoose, "startSession").mockResolvedValue(session);

    await expect(withTransaction(async () => "value")).rejects.toThrow(/commit flaky/);

    expect(session.calls.end).toBe(1);
    startSessionSpy.mockRestore();
  });
});

describe("withRetry", () => {
  it("does not retry ValidationError — throws immediately", async () => {
    // Arrange
    const op = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("bad schema"), { name: "ValidationError" }));

    // Act + Assert
    await expect(withRetry(op)).rejects.toMatchObject({ name: "ValidationError" });
    expect(op).toHaveBeenCalledTimes(1); // no retry attempted
  });

  it("does not retry CastError — throws immediately", async () => {
    const op = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("bad id"), { name: "CastError" }));
    await expect(withRetry(op)).rejects.toMatchObject({ name: "CastError" });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors up to maxRetries, then throws last", async () => {
    // Arrange — fail twice, succeed on attempt 3
    const op = jest
      .fn()
      .mockRejectedValueOnce(new Error("transient 1"))
      .mockRejectedValueOnce(new Error("transient 2"))
      .mockResolvedValueOnce("done");

    // Act — fast backoff to keep the test snappy
    const result = await withRetry(op, { maxRetries: 3, delay: 1, backoff: 1 });

    // Assert
    expect(result).toBe("done");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("throws the last error after exhausting maxRetries", async () => {
    // Arrange — always fail
    const op = jest.fn().mockRejectedValue(new Error("never works"));

    // Act + Assert
    await expect(withRetry(op, { maxRetries: 2, delay: 1, backoff: 1 })).rejects.toThrow(
      /never works/
    );

    // 1 initial attempt + 2 retries = 3 calls
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("returns the op result on first successful attempt (no retry)", async () => {
    const op = jest.fn().mockResolvedValue("first try");
    const result = await withRetry(op);
    expect(result).toBe("first try");
    expect(op).toHaveBeenCalledTimes(1);
  });
});
