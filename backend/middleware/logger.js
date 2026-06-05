const logger = require("../utils/logger");

/**
 * Request logging middleware.
 * Logs method, url, ip, userAgent on entry.
 * Logs status + duration (ms) on response finish.
 * Redacts password / confirmPassword / token from body.
 */
module.exports = (req, res, next) => {
  const start = Date.now();
  const safeBody = { ...req.body };
  delete safeBody.password;
  delete safeBody.confirmPassword;
  delete safeBody.token;

  logger.http({
    event: "request",
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("user-agent"),
    body: Object.keys(safeBody).length ? safeBody : undefined,
  });

  res.on("finish", () => {
    logger.http({
      event: "response",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
};
