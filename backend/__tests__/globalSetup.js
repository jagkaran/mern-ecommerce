"use strict";
/**
 * Jest globalSetup — starts MongoMemoryServer and writes the URI
 * into a temp file so test workers can read it.
 * (globalSetup runs in a separate process; env vars set here do NOT
 *  reach test workers — we use a temp file as the bridge instead.)
 */
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs   = require("fs");
const path = require("path");

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri    = mongod.getUri();
  // Store handle so globalTeardown can stop it
  global.__MONGOD__ = mongod;
  // Write URI to a temp file that setupFilesAfterFramework can read
  fs.writeFileSync(path.join(__dirname, ".mongo-uri"), uri, "utf8");
};
