const sendEmail = require("../utils/sendEmail");
const logger = require("../utils/logger");
const {
  passwordResetHtml,
  passwordResetText,
  orderConfirmationHtml,
  orderConfirmationText,
} = require("../utils/emailTemplates");

class EmailService {
  /**
   * Send a password reset email.
   * @param {string} email - recipient
   * @param {string} resetUrl - absolute URL pointing at the frontend reset page
   * @param {string} [name] - recipient name (optional greeting)
   */
  async sendPasswordReset(email, resetUrl, name = null) {
    const subject = "Reset your Click.it Store password";
    const html = passwordResetHtml({ name, resetUrl });
    const message = passwordResetText({ name, resetUrl });
    try {
      await sendEmail({ email, subject, message, html });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Password reset email failed for ${email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send an order confirmation email.
   * @param {string} email - recipient
   * @param {object} order - order document (or plain object) with the
   *                         schema fields in models/orderModel.js
   * @param {string} [name] - recipient name
   */
  async sendOrderConfirmation(email, order, name = null) {
    const currency = (order && order.currency) || "USD";
    const subject = `Order #${order._id} confirmed — thanks for shopping with us`;
    // CTA links to the frontend OrderDetails route (/order/:id). Skip the
    // button entirely if CLIENT_URL isn't set so we never link to a 404.
    const orderUrl = process.env.CLIENT_URL
      ? `${process.env.CLIENT_URL}/order/${order._id}`
      : null;
    const html = orderConfirmationHtml({ name, order, currency, orderUrl });
    const message = orderConfirmationText({ name, order, currency, orderUrl });
    try {
      await sendEmail({ email, subject, message, html });
      logger.info(`Order confirmation email sent to ${email} for order ${order._id}`);
    } catch (error) {
      // Best-effort: do NOT rethrow — the order is already committed and
      // the customer already paid. Operators see the log line, the user
      // can still get their order details from /orders/me.
      logger.error(
        `Order confirmation email failed for ${email} order ${order._id}: ${error.message}`
      );
    }
  }
}

module.exports = new EmailService();