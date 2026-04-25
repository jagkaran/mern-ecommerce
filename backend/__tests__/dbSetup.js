"use strict";
// setupFilesAfterEnv: runs INSIDE each test worker after Jest is installed.
// Reads the MongoMemoryServer URI from the file written by globalSetup
// and connects mongoose before any test runs.
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
  for (const name of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});
