const VpsMonitor = require("./monitors/vpsMonitor");
const logger = require("./utils/logger");
const config = require("./config/config");

class Application {
  constructor() {
    this.vpsMonitor = new VpsMonitor();
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        await this.vpsMonitor.shutdown();
        logger.info("Application shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { error: error.message });
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2")); // For nodemon

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      shutdown("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", {
        reason: reason.toString(),
        promise,
      });
      shutdown("unhandledRejection");
    });
  }

  async start() {
    try {
      logger.info("Starting VPS CPU Monitor Application...");
      logger.info("Configuration:", {
        cpuThreshold: config.monitoring.cpuThreshold,
        highCpuDuration: config.monitoring.highCpuDuration,
        cooldownPeriod: config.monitoring.cooldownPeriod,
        monitoringInterval: config.monitoring.monitoringInterval,
      });

      await this.vpsMonitor.startMonitoring();

      logger.info("VPS CPU Monitor Application started successfully");
      logger.info("Press Ctrl+C to stop the application");
    } catch (error) {
      logger.error("Failed to start application", { error: error.message });
      process.exit(1);
    }
  }

  async stop() {
    try {
      await this.vpsMonitor.shutdown();
    } catch (error) {
      logger.error("Error stopping application", { error: error.message });
    }
  }
}

// Start the application
const app = new Application();
app.start();

// Export for testing purposes
module.exports = Application;
