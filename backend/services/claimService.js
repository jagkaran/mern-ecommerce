const crypto = require("crypto");
const Order = require("../models/orderModel");
const User  = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { withTransaction } = require("../utils/transaction");
const logger = require("../utils/logger");

function secret() { return process.env.JWT_SECRET; }

function sign(orderId, guestEmail) {
  return crypto.createHmac("sha256", secret()).update(`${orderId}|${guestEmail}`).digest("hex");
}

exports.mintClaimToken = function mintClaimToken(orderId, guestEmail) {
  return sign(orderId, (guestEmail || "").toLowerCase());
};

async function findOrderByToken(token) {
  // We don't store the raw token — only HMAC. Compute candidate hashes for
  // recent guest orders. Brute-force safe: scope to orders w/ a claimTokenHash.
  // We include already-claimed orders so replay can return the
  // "Order already claimed" error below; without this, a second claim attempt
  // would 400 with "Invalid claim token" (the token matches but the cleared
  // claimTokenHash filters the row out of the query).
  const orders = await Order.find({
    claimTokenHash: { $exists: true, $ne: null },
  })
    .select("+claimTokenHash")
    .limit(50)
    .sort({ createdAt: -1 })
    .lean();
  for (const o of orders) {
    if (!o.guestEmail) continue;
    if (sign(o._id.toString(), o.guestEmail) === token) return o;
  }
  return null;
}

exports.claimGuestOrder = async function claimGuestOrder({ claimToken, password }) {
  if (!/^[0-9a-f]{64}$/.test(claimToken || "")) {
    throw new ErrorHandler("Invalid claim token", 400);
  }

  const order = await findOrderByToken(claimToken);
  if (!order) throw new ErrorHandler("Invalid claim token", 400);

  if (order.claimedAt) throw new ErrorHandler("Order already claimed", 400);

  const email = order.guestEmail;
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new ErrorHandler("An account exists for that email — please sign in", 409);
    err.code = "ACCOUNT_EXISTS";
    throw err;
  }

  const result = await withTransaction(async (session) => {
    const localPart = email.split("@")[0];
    // User schema enforces minlength:4 on name — pad short local-parts so
    // claim flow doesn't 500 on emails like r1@y.io.
    const displayName = (localPart.length >= 4 ? localPart : `${localPart}-user`).slice(0, 30);
    const [user] = await User.create(
      [{ name: displayName, email, password, profilePic: { public_id: "guest", url: "" } }],
      { session }
    );

    const linked = await Order.find({ guestEmail: email })
      .select("_id user claimTokenHash claimedAt")
      .session(session);

    for (const o of linked) {
      // verify each order's claimTokenHash matches this token (in case guest
      // had multiple orders; rare but possible). We deliberately keep
      // claimTokenHash set after claim — removing it would cause the
      // findOrderByToken scan to silently miss the order on replay, returning
      // "Invalid claim token" instead of the more informative "already claimed".
      const sig = sign(o._id.toString(), email);
      if (sig !== claimToken && o.claimTokenHash) continue;
      o.user = user._id;
      o.claimedAt = new Date();
      await o.save({ session });
    }

    return { user };
  });

  logger.info(`Guest claimed order ${order._id}; new user ${result.user._id}`);
  return result;
};
