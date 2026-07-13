const Order = require("../models/orderModel");
describe("Order model — guest fields", () => {
  it("accepts order without user when guestEmail provided", async () => {
    const o = await Order.create({
      shippingInfo: { address: "1 St", city: "C", state: "S", country: "X", zip: 12345, phone: 1234567890 },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: "64a000000000000000000000" }],
      paymentInfo: { id: "pi_test", status: "succeeded" },
      itemPrice: 1, taxPrice: 0, shippingPrice: 0, totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "guest@example.com",
      claimTokenHash: "abc123",
    });
    expect(o.guestEmail).toBe("guest@example.com");
    expect(o.user).toBeUndefined();
    expect(o.claimTokenHash).toBe("abc123");
  });
});
