const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config/config");

class CloudflareService {
  constructor() {
    this.baseURL = config.cloudflare.baseUrl;
    this.apiToken = config.cloudflare.apiToken;
    this.zoneId = config.cloudflare.zoneId;
    this.defaultSecurityLevel = config.cloudflare.defaultSecurityLevel;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios({
          method,
          url,
          headers,
          data,
          timeout: 10000, // 10 second timeout
        });

        if (response.data.success) {
          return response.data;
        } else {
          throw new Error(
            `Cloudflare API error: ${JSON.stringify(response.data.errors)}`
          );
        }
      } catch (error) {
        logger.warn(`Cloudflare API attempt ${attempt} failed`, {
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

  async getSecurityLevel() {
    try {
      const response = await this.makeRequest(
        "GET",
        `/zones/${this.zoneId}/settings/security_level`
      );
      const securityLevel = response.result.value;
      logger.info(`Current Cloudflare security level: ${securityLevel}`);
      return securityLevel;
    } catch (error) {
      logger.error("Failed to get Cloudflare security level", {
        error: error.message,
      });
      throw error;
    }
  }

  async setSecurityLevel(level) {
    try {
      const validLevels = [
        "essentially_off",
        "low",
        "medium",
        "high",
        "under_attack",
      ];

      if (!validLevels.includes(level)) {
        throw new Error(
          `Invalid security level: ${level}. Valid levels: ${validLevels.join(
            ", "
          )}`
        );
      }

      const data = { value: level };
      await this.makeRequest(
        "PATCH",
        `/zones/${this.zoneId}/settings/security_level`,
        data
      );

      logger.info(`Successfully set Cloudflare security level to: ${level}`);
      return true;
    } catch (error) {
      logger.error("Failed to set Cloudflare security level", {
        error: error.message,
        level,
      });
      throw error;
    }
  }

  async enableUnderAttackMode() {
    try {
      const currentLevel = await this.getSecurityLevel();

      if (currentLevel === "under_attack") {
        logger.info("Cloudflare already in Under Attack mode");
        return true;
      }

      await this.setSecurityLevel("under_attack");
      logger.warn("Cloudflare Under Attack mode enabled");
      return true;
    } catch (error) {
      logger.error("Failed to enable Under Attack mode", {
        error: error.message,
      });
      throw error;
    }
  }

  async disableUnderAttackMode() {
    try {
      const currentLevel = await this.getSecurityLevel();

      if (currentLevel !== "under_attack") {
        logger.info("Cloudflare not in Under Attack mode");
        return true;
      }

      await this.setSecurityLevel(this.defaultSecurityLevel);
      logger.info(
        `Cloudflare Under Attack mode disabled, set to ${this.defaultSecurityLevel}`
      );
      return true;
    } catch (error) {
      logger.error("Failed to disable Under Attack mode", {
        error: error.message,
      });
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.getSecurityLevel();
      logger.info("Cloudflare API connection test successful");
      return true;
    } catch (error) {
      logger.error("Cloudflare API connection test failed", {
        error: error.message,
      });
      return false;
    }
  }

  // Get current security level without logging
  async getCurrentSecurityLevel() {
    try {
      const response = await this.makeRequest(
        "GET",
        `/zones/${this.zoneId}/settings/security_level`
      );
      return response.result.value;
    } catch (error) {
      logger.error("Failed to get current security level", {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = CloudflareService;
