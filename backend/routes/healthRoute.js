const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");

/**
 * GET /api/v1/health
 *
 * Lightweight liveness + readiness probe used by:
 *  - Render health checks (render.yaml healthCheckPath)
 *  - CI smoke tests
 *  - External uptime monitors
 *
 * Returns 200 when the server is up AND MongoDB is connected.
 * Returns 503 when MongoDB is disconnected so load balancers
 * can pull the instance out of rotation automatically.
 *
 * Response shape:
 * {
 *   status:    "ok" | "degraded",
 *   uptime:    <seconds since process start>,
 *   timestamp: <ISO 8601>,
 *   db:        "connected" | "disconnected",
 *   memory: {
 *     heapUsedMB:  <number>,
 *     heapTotalMB: <number>,
 *     rssMB:       <number>
 *   }
 * }
 */
router.get("/health", (req, res) => {
  const dbState    = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbOk       = dbState === 1;
  const dbStatus   = dbOk ? "connected" : "disconnected";

  const mem        = process.memoryUsage();
  const toMB       = (b) => Math.round(b / 1024 / 1024);

  const body = {
    status:    dbOk ? "ok" : "degraded",
    uptime:    Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db:        dbStatus,
    memory: {
      heapUsedMB:  toMB(mem.heapUsed),
      heapTotalMB: toMB(mem.heapTotal),
      rssMB:       toMB(mem.rss),
    },
  };

  res.status(dbOk ? 200 : 503).json(body);
});

module.exports = router;
