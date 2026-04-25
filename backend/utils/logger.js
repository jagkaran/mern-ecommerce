const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

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
    ...(process.env.NODE_ENV === "PRODUCTION"
      ? [
          new transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
          }),
          new transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

module.exports = logger;
