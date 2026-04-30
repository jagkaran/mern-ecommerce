const nodeMailer = require("nodemailer");

/**
 * Send an email via Nodemailer.
 *
 * Google no longer accepts regular Gmail passwords over SMTP (disabled
 * May 2022). SMTP_PASSWORD MUST be a Gmail App Password — a 16-character
 * code generated at:
 *   Google Account → Security → 2-Step Verification → App passwords
 *
 * Required env vars:
 *   SMTP_SERVICE   e.g. gmail
 *   SMTP_MAIL      your Gmail address
 *   SMTP_PASSWORD  16-char App Password (NOT your Google account password)
 */
const sendEmail = async (options) => {
  // When `service` is provided, Nodemailer resolves host/port/secure
  // automatically from its built-in service presets. Setting host/port
  // alongside service causes them to override the preset and can break
  // the connection. Only pass host/port when NOT using a named service.
  const transportConfig = process.env.SMTP_SERVICE
    ? {
        service: process.env.SMTP_SERVICE,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      };

  const transporter = nodeMailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"Click.it Store" <${process.env.SMTP_MAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
