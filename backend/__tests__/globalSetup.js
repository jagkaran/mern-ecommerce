"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs   = require("fs");
const path = require("path");
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  fs.writeFileSync(path.join(__dirname, ".mongo-uri"), mongod.getUri(), "utf8");
};
