/**
 * Transaction Utility
 * Provides transaction support for MongoDB operations
 */

const mongoose = require("mongoose");

/**
 * Execute operations within a transaction
 * @param {Function} operation - Async function that receives session as parameter
 * @returns {Promise<any>} - Result of the operation
 */
async function withTransaction(operation) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Execute operations with retry logic
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of the operation
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
  } = options;

  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.name === "ValidationError" || error.name === "CastError") {
        throw error;
      }

      // Don't retry on last attempt
      if (i === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(backoff, i)));
    }
  }

  throw lastError;
}

/**
 * Execute operations within a transaction with retry logic
 * @param {Function} operation - Async function that receives session as parameter
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of the operation
 */
async function withTransactionAndRetry(operation, options = {}) {
  return withRetry(() => withTransaction(operation), options);
}

module.exports = {
  withTransaction,
  withRetry,
  withTransactionAndRetry,
};
