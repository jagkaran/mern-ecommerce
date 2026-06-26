"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs   = require("fs");
const path = require("path");

// Pin the MongoDB binary version for deterministic downloads across CI/dev.
// Prevents transient download failures from fastdl outages.
// Override via env if you need a specific version.
process.env.MONGOMS_VERSION  = process.env.MONGOMS_VERSION  || "7.0.14";
process.env.MONGOMS_DISTRO   = process.env.MONGOMS_DISTRO   || "ubuntu";

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  fs.writeFileSync(path.join(__dirname, ".mongo-uri"), mongod.getUri(), "utf8");
};
