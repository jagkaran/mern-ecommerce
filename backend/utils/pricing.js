"use strict";

const ErrorHandler = require("./errorHandler");
const Product = require("../models/productModel");

const TAX_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FLAT = 50;

async function computeOrderPricing(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("At least one order item is required", 400);
  }

  let itemPrice = 0;
  const validatedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product)
      .select("name price stock")
      .lean();

    if (!product) {
      throw new ErrorHandler(`Product not found: ${item.product}`, 404);
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ErrorHandler(`Invalid quantity for product: ${product.name}`, 400);
    }

    if (product.stock < quantity) {
      throw new ErrorHandler(`Insufficient stock for product: ${product.name}`, 400);
    }

    itemPrice += product.price * quantity;
    validatedItems.push({ product, quantity });
  }

  const shippingPrice = itemPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const taxPrice = Number((itemPrice * TAX_RATE).toFixed(2));
  const totalPrice = Number((itemPrice + shippingPrice + taxPrice).toFixed(2));

  return { itemPrice, shippingPrice, taxPrice, totalPrice, validatedItems };
}

module.exports = {
  computeOrderPricing,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
};