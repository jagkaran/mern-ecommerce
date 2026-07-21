const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: Number,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
  },

  orderItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: false,
  },

  guestEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true,
    sparse: true,
  },

  claimTokenHash: {
    type: String,
    index: true,
    sparse: true,
    select: false,
  },

  claimedAt: {
    type: Date,
    default: null,
  },

  paymentInfo: {
    id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },

  paidAt: {
    type: Date,
    required: true,
  },

  itemPrice: {
    type: Number,
    required: true,
    default: 0,
  },

  taxPrice: {
    type: Number,
    required: true,
    default: 0,
  },

  shippingPrice: {
    type: Number,
    required: true,
    default: 0,
  },

  // Coupon snapshot — denormalized at order time so historical orders keep
  // their discount info even if the coupon is later edited or removed.
  discount: {
    type: Number,
    required: true,
    default: 0,
  },

  coupon: {
    code:           { type: String, default: null },
    discountType:   { type: String, default: null },
    discountValue:  { type: Number, default: null },
    discountAmount: { type: Number, default: null },
  },

  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },

  // Currency code the user was viewing in when placing the order
  // (e.g. "EUR"). Backend prices are always stored in USD; this field
  // allows the UI to display the order in the same currency context.
  currency: {
    type: String,
    default: "USD",
  },
  // FX rate at time of order — 1 for USD, ~0.92 for EUR, etc.
  currencyRate: {
    type: Number,
    default: 1,
  },

  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },

  deliveredAt: Date,
  createdAt: {
    type: Date,
    // Date.now (no parens) is a function reference Mongoose calls per-doc.
    // Date.now() would be evaluated once at module load and every order
    // would share a single timestamp.
    default: Date.now,
  },
});

// Database indexes for performance
orderSchema.index({ user: 1 }); // For user order lookups
orderSchema.index({ createdAt: -1 }); // For sorting by creation date
orderSchema.index({ orderStatus: 1 }); // For status filtering
orderSchema.index({ user: 1, createdAt: -1 }); // Compound index for user orders with sorting

module.exports = mongoose.model("Order", orderSchema);
