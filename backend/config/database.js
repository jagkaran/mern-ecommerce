const mongoose = require("mongoose");

const connectDB = () => {
  mongoose.connect(process.env.DB_URI).then((data) => {
    console.log(`MongoDB connnected with server: ${data.connection.host}`);
  });
};

module.exports = connectDB;
