const CpuMonitor = require("./cpuMonitor");
const CloudflareService = require("../services/cloudflareService");
const TelegramService = require("../services/telegramService");
const logger = require("../utils/logger");
const config = require("../config/config");

class VpsMonitor {
  constructor() {
    this.cloudflareService = new CloudflareService();
    this.telegramService = new TelegramService();
    this.cpuMonitor = null; // Will be initialized after checking Cloudflare state
    this.isRunning = false;
    this.monitoringInterval = null;
    this.lastAction = null;
  }

  async initialize() {
    try {
      logger.info("Initializing VPS Monitor...");

      // Test connections
      const cloudflareTest = await this.cloudflareService.testConnection();
      const telegramTest = await this.telegramService.testConnection();

      if (!cloudflareTest) {
        throw new Error("Cloudflare API connection failed");
      }

      if (!telegramTest) {
        throw new Error("Telegram API connection failed");
      }

      // Check current Cloudflare security level and initialize CPU monitor accordingly
      const currentSecurityLevel =
        await this.cloudflareService.getCurrentSecurityLevel();
      const isUnderAttack = currentSecurityLevel === "under_attack";

      logger.info(`Current Cloudflare security level: ${currentSecurityLevel}`);

      // Initialize CPU monitor with the current state
      this.cpuMonitor = new CpuMonitor(isUnderAttack);
      this.cpuMonitor.setInitialState(isUnderAttack);

      // Send startup notification with current state
      await this.telegramService.sendStartupNotification(currentSecurityLevel);

      logger.info("VPS Monitor initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize VPS Monitor", {
        error: error.message,
      });
      throw error;
    }
  }

  async handleCpuStatus(cpuStatus) {
    try {
      const { status, cpuUsage, duration, action } = cpuStatus;

      // Handle different actions
      switch (action) {
        case "enable_under_attack":
          await this.handleUnderAttackEnable(cpuUsage, duration);
          break;

        case "disable_under_attack":
          await this.handleUnderAttackDisable(cpuUsage, duration);
          break;

        case "none":
          // Just log status if it's been a while since last action
          const timeSinceLastAction = this.lastAction
            ? Date.now() - this.lastAction
            : Infinity;

          if (timeSinceLastAction > 300000) {
            // 5 minutes
            logger.info(`VPS Status: ${status}, CPU: ${cpuUsage}%`);
            this.lastAction = Date.now();
          }
          break;
      }
    } catch (error) {
      logger.error("Error handling CPU status", { error: error.message });
      await this.telegramService.sendErrorNotification(error);
    }
  }

  async handleUnderAttackEnable(cpuUsage, duration) {
    try {
      logger.warn(
        `Enabling Under Attack mode - CPU: ${cpuUsage}%, Duration: ${duration}s`
      );

      // Enable Cloudflare Under Attack mode
      await this.cloudflareService.enableUnderAttackMode();

      // Send Telegram notification
      await this.telegramService.sendNotification("under_attack_enabled", {
        cpuUsage,
        duration,
      });

      this.lastAction = Date.now();
      logger.info("Under Attack mode enabled successfully");
    } catch (error) {
      logger.error("Failed to enable Under Attack mode", {
        error: error.message,
      });
      await this.telegramService.sendErrorNotification(error);
      throw error;
    }
  }

  async handleUnderAttackDisable(cpuUsage, duration) {
    try {
      logger.info(
        `Disabling Under Attack mode - CPU: ${cpuUsage}%, Normal CPU Cooldown: ${duration}s`
      );

      // Disable Cloudflare Under Attack mode
      await this.cloudflareService.disableUnderAttackMode();

      // Send Telegram notification
      await this.telegramService.sendNotification("under_attack_disabled", {
        cpuUsage,
        duration,
      });

      this.lastAction = Date.now();
      logger.info("Under Attack mode disabled successfully");
    } catch (error) {
      logger.error("Failed to disable Under Attack mode", {
        error: error.message,
      });
      await this.telegramService.sendErrorNotification(error);
      throw error;
    }
  }

  async startMonitoring() {
    if (this.isRunning) {
      logger.warn("VPS Monitor is already running");
      return;
    }

    try {
      await this.initialize();

      this.isRunning = true;
      logger.info(
        `Starting VPS monitoring with ${config.monitoring.monitoringInterval}s intervals`
      );

      this.monitoringInterval = setInterval(async () => {
        try {
          const cpuStatus = await this.cpuMonitor.checkCpuStatus();
          await this.handleCpuStatus(cpuStatus);
        } catch (error) {
          logger.error("Error in monitoring cycle", { error: error.message });
          await this.telegramService.sendErrorNotification(error);
        }
      }, config.monitoring.monitoringInterval * 1000);

      logger.info("VPS monitoring started successfully");
    } catch (error) {
      logger.error("Failed to start VPS monitoring", { error: error.message });
      throw error;
    }
  }

  async stopMonitoring() {
    if (!this.isRunning) {
      logger.warn("VPS Monitor is not running");
      return;
    }

    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      this.isRunning = false;
      logger.info("VPS monitoring stopped");
    } catch (error) {
      logger.error("Error stopping VPS monitoring", { error: error.message });
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      cpuStatus: this.cpuMonitor ? this.cpuMonitor.getStatus() : null,
      lastAction: this.lastAction,
      config: {
        cpuThreshold: config.monitoring.cpuThreshold,
        highCpuDuration: config.monitoring.highCpuDuration,
        cooldownPeriod: config.monitoring.cooldownPeriod,
        normalCpuCooldown: config.monitoring.normalCpuCooldown,
        monitoringInterval: config.monitoring.monitoringInterval,
        defaultSecurityLevel: config.cloudflare.defaultSecurityLevel,
      },
    };
  }

  // Graceful shutdown handler
  async shutdown() {
    logger.info("Shutting down VPS Monitor...");
    await this.stopMonitoring();
    logger.info("VPS Monitor shutdown complete");
  }
}

module.exports = VpsMonitor;
