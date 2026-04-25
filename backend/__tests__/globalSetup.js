"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri    = mongod.getUri();
  // Store so globalTeardown can stop the server
  process.env.MONGO_URI_TEST = uri;
  global.__MONGOD__ = mongod;
  await mongoose.connect(uri);
};
