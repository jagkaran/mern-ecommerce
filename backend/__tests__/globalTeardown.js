"use strict";
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");
module.exports = async function globalTeardown() {
  try {
    const uri = fs.readFileSync(path.join(__dirname, ".mongo-uri"), "utf8");
    if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  } catch (_) {}
  try { fs.unlinkSync(path.join(__dirname, ".mongo-uri")); } catch (_) {}
};
