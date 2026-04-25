"use strict";
/**
 * setupFilesAfterFramework — runs INSIDE each test worker after the test
 * framework is installed. Safe to use mongoose and jest.mock here.
 * Reads the MongoMemoryServer URI written by globalSetup and connects.
 */
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");

beforeAll(async () => {
  const uriFile = path.join(__dirname, ".mongo-uri");
  const uri = fs.readFileSync(uriFile, "utf8");
  process.env.DB_URI = uri;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  // Each suite cleans its own collections
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});
