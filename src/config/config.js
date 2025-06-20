require("dotenv").config();

class Config {
  constructor() {
    this.validateRequiredEnvVars();
  }

  validateRequiredEnvVars() {
    const required = [
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ZONE_ID",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_ID",
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  get cloudflare() {
    return {
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      defaultSecurityLevel:
        process.env.CLOUDFLARE_DEFAULT_SECURITY_LEVEL || "medium",
      baseUrl: "https://api.cloudflare.com/client/v4",
    };
  }

  get telegram() {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      baseUrl: "https://api.telegram.org/bot",
    };
  }

  get monitoring() {
    return {
      cpuThreshold: parseInt(process.env.CPU_THRESHOLD) || 80,
      highCpuDuration: parseInt(process.env.HIGH_CPU_DURATION) || 15,
      cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD) || 60,
      monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 5,
    };
  }

  get logging() {
    return {
      level: process.env.LOG_LEVEL || "info",
      logToFile: process.env.LOG_TO_FILE === "true",
      logFilePath: process.env.LOG_FILE_PATH || "./logs/monitor.log",
    };
  }
}

module.exports = new Config();
