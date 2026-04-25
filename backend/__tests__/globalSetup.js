"use strict";
const mongoose = require("mongoose");

module.exports = async function globalSetup() {
  const uri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/mern_test";
  await mongoose.connect(uri);
  // Store connection so globalTeardown can close it
  global.__MONGOOSE__ = mongoose;
};
