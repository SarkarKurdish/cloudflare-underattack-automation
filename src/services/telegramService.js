const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config/config");

class TelegramService {
  constructor() {
    this.baseURL = config.telegram.baseUrl;
    this.botToken = config.telegram.botToken;
    this.chatId = config.telegram.chatId;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseURL}${this.botToken}${endpoint}`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios({
          method,
          url,
          data,
          timeout: 10000, // 10 second timeout
        });

        if (response.data.ok) {
          return response.data;
        } else {
          throw new Error(`Telegram API error: ${response.data.description}`);
        }
      } catch (error) {
        logger.warn(`Telegram API attempt ${attempt} failed`, {
          error: error.message,
          endpoint,
          attempt,
        });

        if (attempt === this.maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt)
        );
      }
    }
  }

  formatMessage(type, data) {
    const timestamp = new Date().toISOString();
    const serverName = require("os").hostname();

    switch (type) {
      case "under_attack_enabled":
        return (
          `🚨 *VPS UNDER ATTACK MODE ENABLED* 🚨\n\n` +
          `*Server:* ${serverName}\n` +
          `*CPU Usage:* ${data.cpuUsage}%\n` +
          `*Duration:* ${data.duration.toFixed(1)}s\n` +
          `*Threshold:* ${config.monitoring.cpuThreshold}%\n` +
          `*Time:* ${timestamp}\n\n` +
          `Cloudflare security level set to "Under Attack" mode.`
        );

      case "under_attack_disabled":
        return (
          `✅ *VPS UNDER ATTACK MODE DISABLED* ✅\n\n` +
          `*Server:* ${serverName}\n` +
          `*CPU Usage:* ${data.cpuUsage}%\n` +
          `*Cooldown Period:* ${data.duration.toFixed(1)}s\n` +
          `*Time:* ${timestamp}\n\n` +
          `Cloudflare security level restored to "${config.cloudflare.defaultSecurityLevel.replace(
            /_/g,
            " "
          )}".`
        );

      case "status_update":
        return (
          `📊 *VPS Status Update*\n\n` +
          `*Server:* ${serverName}\n` +
          `*CPU Usage:* ${data.cpuUsage}%\n` +
          `*Status:* ${data.status}\n` +
          `*Time:* ${timestamp}`
        );

      case "error":
        return (
          `❌ *VPS Monitor Error*\n\n` +
          `*Server:* ${serverName}\n` +
          `*Error:* ${data.error}\n` +
          `*Time:* ${timestamp}`
        );

      case "startup":
        const currentLevel = data.currentSecurityLevel || "unknown";
        const statusEmoji = currentLevel === "under_attack" ? "🚨" : "✅";
        const statusText =
          currentLevel === "under_attack" ? "UNDER ATTACK" : "NORMAL";

        return (
          `${statusEmoji} *VPS Monitor Started* ${statusEmoji}\n\n` +
          `*Server:* ${serverName}\n` +
          `*Current Cloudflare Level:* ${currentLevel.replace(/_/g, " ")}\n` +
          `*Status:* ${statusText}\n` +
          `*CPU Threshold:* ${config.monitoring.cpuThreshold}%\n` +
          `*High CPU Duration:* ${config.monitoring.highCpuDuration}s\n` +
          `*Cooldown Period:* ${config.monitoring.cooldownPeriod}s\n` +
          `*Default Security Level:* ${config.cloudflare.defaultSecurityLevel.replace(
            /_/g,
            " "
          )}\n` +
          `*Monitoring Interval:* ${config.monitoring.monitoringInterval}s\n` +
          `*Time:* ${timestamp}`
        );

      default:
        return (
          `ℹ️ *VPS Monitor Notification*\n\n` +
          `*Server:* ${serverName}\n` +
          `*Message:* ${data.message}\n` +
          `*Time:* ${timestamp}`
        );
    }
  }

  async sendMessage(message) {
    try {
      const data = {
        chat_id: this.chatId,
        text: message,
        parse_mode: "Markdown",
      };

      await this.makeRequest("POST", "/sendMessage", data);
      logger.info("Telegram message sent successfully");
      return true;
    } catch (error) {
      logger.error("Failed to send Telegram message", { error: error.message });
      throw error;
    }
  }

  async sendNotification(type, data = {}) {
    try {
      const message = this.formatMessage(type, data);
      await this.sendMessage(message);
      return true;
    } catch (error) {
      logger.error("Failed to send Telegram notification", {
        error: error.message,
        type,
        data,
      });
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await this.makeRequest("GET", "/getMe");
      const botInfo = response.result;
      logger.info("Telegram API connection test successful", {
        botName: botInfo.first_name,
        username: botInfo.username,
      });
      return true;
    } catch (error) {
      logger.error("Telegram API connection test failed", {
        error: error.message,
      });
      return false;
    }
  }

  async sendStartupNotification(currentSecurityLevel = null) {
    try {
      await this.sendNotification("startup", { currentSecurityLevel });
    } catch (error) {
      logger.warn("Failed to send startup notification", {
        error: error.message,
      });
    }
  }

  async sendErrorNotification(error) {
    try {
      await this.sendNotification("error", { error: error.message });
    } catch (telegramError) {
      logger.error("Failed to send error notification", {
        originalError: error.message,
        telegramError: telegramError.message,
      });
    }
  }
}

module.exports = TelegramService;
