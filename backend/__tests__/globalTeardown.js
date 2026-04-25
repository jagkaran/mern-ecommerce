"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");

module.exports = async function globalTeardown() {
  // Re-read URI to connect and drop
  try {
    const uri = fs.readFileSync(path.join(__dirname, ".mongo-uri"), "utf8");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  } catch (_) {}
  // Stop the in-memory server
  const mongod = await MongoMemoryServer.create();
  await mongod.stop();
  // Clean up temp file
  try { fs.unlinkSync(path.join(__dirname, ".mongo-uri")); } catch (_) {}
};
