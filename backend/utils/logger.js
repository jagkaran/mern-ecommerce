const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Build transport list based on environment.
// In production we use DailyRotateFile so logs are automatically split
// by date, compressed, and pruned — preventing disk exhaustion.
// In development we only write to the console to keep things simple.
const productionTransports = [];

if (process.env.NODE_ENV === "PRODUCTION") {
  let DailyRotateFile;
  try {
    // Optional peer dependency — gracefully fall back to plain File
    // transport if the package is not installed yet.
    DailyRotateFile = require("winston-daily-rotate-file");
  } catch {
    DailyRotateFile = null;
  }

  const logsDir = path.join(__dirname, "../../logs");

  if (DailyRotateFile) {
    // Rotate daily, keep 14 days, compress old files with gzip.
    productionTransports.push(
      new DailyRotateFile({
        filename:     path.join(logsDir, "error-%DATE%.log"),
        datePattern:  "YYYY-MM-DD",
        level:        "error",
        maxSize:      "20m",   // rotate early if a single day exceeds 20 MB
        maxFiles:     "14d",   // keep 14 days
        zippedArchive: true,
        auditFile:    path.join(logsDir, ".error-audit.json"),
      })
    );
    productionTransports.push(
      new DailyRotateFile({
        filename:     path.join(logsDir, "combined-%DATE%.log"),
        datePattern:  "YYYY-MM-DD",
        maxSize:      "20m",
        maxFiles:     "14d",
        zippedArchive: true,
        auditFile:    path.join(logsDir, ".combined-audit.json"),
      })
    );
  } else {
    // Fallback: plain File transport (no rotation) — install
    // winston-daily-rotate-file to enable rotation.
    productionTransports.push(
      new transports.File({
        filename: path.join(logsDir, "error.log"),
        level:    "error",
      })
    );
    productionTransports.push(
      new transports.File({
        filename: path.join(logsDir, "combined.log"),
      })
    );
  }
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "PRODUCTION" ? "warn" : "info"),
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize({ all: process.env.NODE_ENV !== "PRODUCTION" }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    ...productionTransports,
  ],
  exitOnError: false,
});

module.exports = logger;
