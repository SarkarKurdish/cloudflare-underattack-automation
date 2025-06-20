const CpuMonitor = require("./monitors/cpuMonitor");
const CloudflareService = require("./services/cloudflareService");
const TelegramService = require("./services/telegramService");
const logger = require("./utils/logger");
const config = require("./config/config");

async function testConnections() {
  console.log("🔍 Testing VPS CPU Monitor Connections...\n");

  try {
    // Test CPU Monitoring
    console.log("1. Testing CPU Monitoring...");
    const cpuMonitor = new CpuMonitor();
    const cpuUsage = await cpuMonitor.getCpuUsage();
    console.log(`✅ CPU Monitoring: ${cpuUsage}% usage detected\n`);

    // Test Cloudflare API
    console.log("2. Testing Cloudflare API...");
    const cloudflareService = new CloudflareService();
    const cloudflareTest = await cloudflareService.testConnection();
    if (cloudflareTest) {
      const currentLevel = await cloudflareService.getSecurityLevel();
      console.log(
        `✅ Cloudflare API: Connected (Current level: ${currentLevel})\n`
      );
    } else {
      console.log("❌ Cloudflare API: Connection failed\n");
    }

    // Test Telegram API
    console.log("3. Testing Telegram API...");
    const telegramService = new TelegramService();
    const telegramTest = await telegramService.testConnection();
    if (telegramTest) {
      console.log("✅ Telegram API: Connected\n");
    } else {
      console.log("❌ Telegram API: Connection failed\n");
    }

    // Test Telegram Notification
    console.log("4. Testing Telegram Notification...");
    try {
      await telegramService.sendNotification("status_update", {
        cpuUsage: cpuUsage,
        status: "test",
      });
      console.log("✅ Telegram Notification: Test message sent\n");
    } catch (error) {
      console.log(`❌ Telegram Notification: ${error.message}\n`);
    }

    // Display Configuration
    console.log("5. Current Configuration:");
    console.log(`   CPU Threshold: ${config.monitoring.cpuThreshold}%`);
    console.log(`   High CPU Duration: ${config.monitoring.highCpuDuration}s`);
    console.log(`   Cooldown Period: ${config.monitoring.cooldownPeriod}s`);
    console.log(
      `   Monitoring Interval: ${config.monitoring.monitoringInterval}s`
    );
    console.log(
      `   Default Security Level: ${config.cloudflare.defaultSecurityLevel}`
    );
    console.log(`   Log Level: ${config.logging.level}`);
    console.log(`   Log to File: ${config.logging.logToFile}\n`);

    // Test State Initialization
    console.log("6. Testing State Initialization...");
    const testUnderAttack = new CpuMonitor(true);
    const testNormal = new CpuMonitor(false);
    console.log(`✅ Under Attack State: ${testUnderAttack.isUnderAttack}`);
    console.log(`✅ Normal State: ${testNormal.isUnderAttack}\n`);

    console.log("🎉 All tests completed!");

    if (cloudflareTest && telegramTest) {
      console.log("✅ Ready to start monitoring!");
    } else {
      console.log(
        "⚠️  Some connections failed. Please check your configuration."
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConnections();
}

module.exports = testConnections;
