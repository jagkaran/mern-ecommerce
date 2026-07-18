"use strict";

const ErrorHandler = require("./errorHandler");
const Product = require("../models/productModel");
const engine = require("../services/couponEngine");

const TAX_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FLAT = 50;

/**
 * Compute order pricing with optional coupon discount.
 *
 * Coupon math is delegated to couponEngine.calculateReward so percentage,
 * flat, freeShipping, tiered, and bogo all share one source of truth. For
 * percentage/flat/freeShipping the engine's output matches the previous
 * hand-rolled math exactly — legacy pricing tests stay green. For
 * tiered/bogo the engine adds support the old version didn't have.
 *
 * `freeShipping` is a reward flag the engine sets; pricing applies it by
 * zeroing shippingPrice (which then counts toward the discount total so
 * totalPrice stays consistent).
 *
 * Returns { itemPrice, shippingPrice, taxPrice, discount, totalPrice, validatedItems, coupon }.
 *
 * @param {Array<{product:string,quantity:number}>} orderItems
 * @param {object|null} coupon - resolved coupon object or null/undefined
 * @param {Array<{product:object,quantity:number}>|null} [prevalidatedItems]
 *   Optional. When provided, pricing skips its own product lookup and uses
 *   these items directly — used by orderService so the coupon eligibility
 *   check and the pricing step can share one fetch.
 */
async function computeOrderPricing(orderItems, coupon = null, prevalidatedItems = null) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("At least one order item is required", 400);
  }

  let itemPrice = 0;
  let itemCount = 0;
  const validatedItems = prevalidatedItems || [];

  if (!prevalidatedItems) {
    for (const item of orderItems) {
      const product = await Product.findById(item.product).select("name price stock").lean();

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
      itemCount += quantity;
      validatedItems.push({ product, quantity });
    }
  } else {
    // Trust the caller — they did the stock + existence check already.
    for (const v of validatedItems) {
      itemPrice += v.product.price * v.quantity;
      itemCount += v.quantity;
    }
  }

  let shippingPrice = itemPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const taxPrice = Number((itemPrice * TAX_RATE).toFixed(2));

  let discount = 0;
  if (coupon) {
    const lineItems = validatedItems.map((v) => ({
      product: v.product._id,
      price: v.product.price,
      quantity: v.quantity,
    }));
    const reward = engine.calculateReward(coupon, {
      subtotal: itemPrice,
      itemCount,
      lineItems,
    });
    if (reward.freeShipping) {
      // freeShipping: zero shipping and add the shipping savings into discount
      // so totalPrice math stays in one place below.
      discount += shippingPrice;
      shippingPrice = 0;
    }
    discount += reward.discountAmount;
    // Bound the total discount to the sum of items + shipping — defensive,
    // engine already caps the reward portion to itemPrice.
    discount = Math.min(discount, itemPrice + shippingPrice);
  }

  const totalPrice = Number(
    Math.max(0, itemPrice + shippingPrice + taxPrice - discount).toFixed(2)
  );

  return {
    itemPrice,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice,
    validatedItems,
    coupon: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: discount,
        }
      : null,
  };
}

module.exports = {
  computeOrderPricing,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
};
