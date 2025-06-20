const si = require("systeminformation");
const logger = require("../utils/logger");
const config = require("../config/config");

class CpuMonitor {
  constructor(initialUnderAttackState = false) {
    this.highCpuStartTime = null;
    this.isUnderAttack = initialUnderAttackState;
    this.normalCpuStartTime = null;
    this.lastCpuUsage = 0;
  }

  setInitialState(isUnderAttack) {
    this.isUnderAttack = isUnderAttack;
    if (isUnderAttack) {
      logger.info(
        "Initialized with Under Attack state (Cloudflare already in Under Attack mode)"
      );
    } else {
      logger.info("Initialized with normal state");
    }
  }

  async getCpuUsage() {
    try {
      const cpuData = await si.currentLoad();
      return Math.round(cpuData.currentLoad);
    } catch (error) {
      logger.error("Failed to get CPU usage", { error: error.message });
      throw error;
    }
  }

  async checkCpuStatus() {
    try {
      const cpuUsage = await this.getCpuUsage();
      const now = Date.now();

      logger.debug(`Current CPU usage: ${cpuUsage}%`);

      // Check if CPU is high
      if (cpuUsage > config.monitoring.cpuThreshold) {
        if (!this.highCpuStartTime) {
          this.highCpuStartTime = now;
          logger.info(`High CPU detected: ${cpuUsage}%. Starting timer...`);
        }

        const highCpuDuration = (now - this.highCpuStartTime) / 1000;

        if (
          highCpuDuration >= config.monitoring.highCpuDuration &&
          !this.isUnderAttack
        ) {
          this.isUnderAttack = true;
          this.normalCpuStartTime = null;
          logger.warn(
            `CPU usage above ${config.monitoring.cpuThreshold}% for ${config.monitoring.highCpuDuration} seconds. Triggering Under Attack mode.`
          );
          return {
            status: "high",
            cpuUsage,
            duration: highCpuDuration,
            action: "enable_under_attack",
          };
        }
      } else {
        // CPU is normal
        if (this.highCpuStartTime) {
          logger.info(`CPU usage returned to normal: ${cpuUsage}%`);
          this.highCpuStartTime = null;
        }

        if (this.isUnderAttack) {
          if (!this.normalCpuStartTime) {
            this.normalCpuStartTime = now;
            logger.info(
              `CPU normal. Starting normal CPU cooldown period of ${config.monitoring.normalCpuCooldown} seconds...`
            );
          }

          const normalCpuDuration = (now - this.normalCpuStartTime) / 1000;

          if (normalCpuDuration >= config.monitoring.normalCpuCooldown) {
            this.isUnderAttack = false;
            this.normalCpuStartTime = null;
            logger.info(
              `Normal CPU cooldown period completed (${config.monitoring.normalCpuCooldown}s). Disabling Under Attack mode.`
            );
            return {
              status: "normal",
              cpuUsage,
              duration: normalCpuDuration,
              action: "disable_under_attack",
            };
          }
        }
      }

      this.lastCpuUsage = cpuUsage;
      return {
        status: this.isUnderAttack ? "high" : "normal",
        cpuUsage,
        action: "none",
      };
    } catch (error) {
      logger.error("Error checking CPU status", { error: error.message });
      throw error;
    }
  }

  getStatus() {
    return {
      isUnderAttack: this.isUnderAttack,
      lastCpuUsage: this.lastCpuUsage,
      highCpuStartTime: this.highCpuStartTime,
      normalCpuStartTime: this.normalCpuStartTime,
    };
  }
}

module.exports = CpuMonitor;
