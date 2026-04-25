"use strict";
const mongoose = require("mongoose");

module.exports = async function globalTeardown() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (global.__MONGOD__) await global.__MONGOD__.stop();
};
