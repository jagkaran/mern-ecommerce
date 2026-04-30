const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter product description"],
  },
  price: {
    type: Number,
    required: [true, "Please enter product price"],
    maxLength: [8, "Price cannot exceed 8 figures"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "please enter Product category"],
  },
  stock: {
    type: Number,
    required: [true, "please enter Product category"],
    maxLength: [4, "Stock cannot exceed 4 figures"],
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      profileImg: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      // Timestamp for when the review was first submitted.
      // When a user edits their review we deliberately keep the original
      // createdAt so readers know when the review was first written.
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Database indexes for performance
productSchema.index({ category: 1 }); // For category filtering
productSchema.index({ createdAt: -1 }); // For sorting by creation date
productSchema.index({ name: "text", description: "text" }); // For full-text search
productSchema.index({ ratings: -1 }); // For sorting by ratings
productSchema.index({ price: 1 }); // For price filtering

module.exports = mongoose.model("Product", productSchema);
