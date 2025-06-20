const winston = require("winston");
const path = require("path");
const fs = require("fs");
const config = require("../config/config");

class Logger {
  constructor() {
    this.setupLogger();
  }

  setupLogger() {
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
          })
        ),
      }),
    ];

    // Add file transport if enabled
    if (config.logging.logToFile) {
      const logDir = path.dirname(config.logging.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      transports.push(
        new winston.transports.File({
          filename: config.logging.logFilePath,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.logging.level,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = new Logger();
