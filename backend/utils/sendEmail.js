const gmailOAuth = require("./gmailOAuth");

/**
 * Send an email via the Gmail API using OAuth2.
 *
 * OAuth-only — no SMTP fallback. Google disabled regular-account SMTP
 * passwords in May 2022 and SMTP with OAuth2 requires the broader
 * `https://mail.google.com/` scope, so we keep the narrow `gmail.send`
 * scope and ship exclusively through the Gmail API.
 *
 * One-time setup:  node backend/scripts/gmail-oauth-setup.js
 * Required env:    SMTP_MAIL (the From-address Gmail address).
 *                  GMAIL_OAUTH_CREDENTIALS_PATH + GMAIL_OAUTH_TOKEN_PATH
 *                  (defaults to backend/config/gmail-oauth-{credentials,
 *                  token}.json).
 *
 * If the OAuth token is expired/revoked, run the setup script above to
 * mint a new refresh_token. Failing fast here surfaces the broken auth
 * immediately rather than masking it with a silent fallback that also
 * fails (as the previous SMTP path did).
 */
const sendEmail = async (options) => {
  const fromAddr = process.env.SMTP_MAIL;
  const { email, subject, message, html } = options;

  const oauth = await gmailOAuth.getAccessToken();
  if (!oauth) {
    throw new Error(
      "Gmail OAuth not configured. Run: node backend/scripts/gmail-oauth-setup.js"
    );
  }
  try {
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
  } catch (err) {
    require("./logger").error(
      `Gmail API send failed for ${email}: ${err.message}`
    );
    throw err;
  }
};

module.exports = sendEmail;