const crypto = require("crypto");
const logger = require("../utils/logger");

// Per-request access log + request ID propagation.
// - Reads X-Request-Id from the incoming request (or generates a UUID).
// - Stamps req.id for downstream handlers + error middleware.
// - Echoes it back on the response so clients can correlate.
// - On response 'finish', logs one structured line per request with
//   method/url/status/duration.
const requestLogger = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id = typeof incoming === "string" && incoming.length <= 128 ? incoming : crypto.randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);

  const startNs = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    // Skip noisy health probe — no value in logging it every second.
    if (req.originalUrl === "/api/v1/health") return;

    logger.info({
      reqId: id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;