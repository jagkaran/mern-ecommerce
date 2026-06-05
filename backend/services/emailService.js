const sendEmail = require("../utils/sendEmail");
const logger = require("../utils/logger");

class EmailService {
  async sendPasswordReset(email, url) {
    const subject = "Ecommerce Password Recovery";
    const message = `Your password reset link:\n\n${url}\n\nIf you did not request this, please ignore it.`;
    try {
      await sendEmail({ email, subject, message });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Password reset email failed for ${email}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EmailService();
