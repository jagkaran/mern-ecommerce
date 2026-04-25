"use strict";
// Connects mongoose inside the test worker using the URI written by globalSetup
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");
beforeAll(async () => {
  const uri = fs.readFileSync(path.join(__dirname, ".mongo-uri"), "utf8");
  process.env.DB_URI = uri;
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
});
afterAll(async () => {
  for (const name of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});
