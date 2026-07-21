const nodeMailer = require("nodemailer");
const gmailOAuth = require("./gmailOAuth");

/**
 * Send an email.
 *
 * Transport selection (first match wins):
 *   1. If `GMAIL_OAUTH_CREDENTIALS_PATH` + `GMAIL_OAUTH_TOKEN_PATH` (or their
 *      defaults in `backend/config/`) exist, use the Gmail API directly via
 *      OAuth2. This is the only path Google allows for new Gmail send
 *      integrations as of mid-2024 with the narrow `gmail.send` scope —
 *      regular SMTP with account passwords was disabled May 2022, and SMTP
 *      with OAuth2 requires the broader `https://mail.google.com/` scope.
 *      One-time setup:  node backend/scripts/gmail-oauth-setup.js
 *
 *   2. Otherwise, fall back to SMTP via Nodemailer using the `SMTP_SERVICE`
 *      / `SMTP_HOST` + `SMTP_PORT` / `SMTP_MAIL` + `SMTP_PASSWORD` env vars.
 *      `SMTP_PASSWORD` in this branch MUST be a 16-character Gmail App
 *      Password, not the raw account password.
 *
 * Required in both modes: `SMTP_MAIL` (the From-address Gmail address).
 */
const sendEmail = async (options) => {
  const fromAddr = process.env.SMTP_MAIL;
  const { email, subject, message, html } = options;

  // 1. Try Gmail API via OAuth2.
  try {
    const oauth = await gmailOAuth.getAccessToken();
    if (oauth) {
      const result = await gmailOAuth.sendViaGmailApi({
        user: oauth.user,
        accessToken: oauth.accessToken,
        from: `"Click.it Store" <${fromAddr}>`,
        to: email,
        subject,
        text: message,
        html,
      });
      require("./logger").info(
        `Email sent via Gmail API to ${email} (id=${result.id})`
      );
      return result;
    }
  } catch (err) {
    // OAuth file present but malformed / refresh failed — log and fall back
    // to SMTP so the request doesn't 500 just because the OAuth config is
    // broken. Operators see this in logs and can fix.
    require("./logger").warn(
      `Gmail OAuth send failed, falling back to SMTP: ${err.message}`
    );
  }

  // 2. Fall back to SMTP (Nodemailer with App Password).
  const transporter = nodeMailer.createTransport(buildSmtpConfig());
  await transporter.sendMail({
    from: `"Click.it Store" <${fromAddr}>`,
    to: email,
    subject,
    text: message,
    html,
  });
};

function buildSmtpConfig() {
  if (process.env.SMTP_SERVICE) {
    return {
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    };
  }
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  };
}

module.exports = sendEmail;