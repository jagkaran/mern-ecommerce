"use strict";
const mongoose = require("mongoose");

module.exports = async function globalTeardown() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};
