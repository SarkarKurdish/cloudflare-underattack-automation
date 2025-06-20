# VPS CPU Monitor with Cloudflare Protection & Telegram Notifications

A Node.js application that continuously monitors VPS CPU usage and automatically manages Cloudflare security levels with Telegram notifications.

## 🚀 Features

- **Real-time CPU Monitoring**: Uses `systeminformation` to track CPU usage
- **Automatic Cloudflare Protection**: Sets security level to "Under Attack" when CPU > 80% for 15+ seconds
- **Smart Recovery**: Restores security level to configurable default after extended cooldown period
- **State Synchronization**: Checks current Cloudflare security level on startup and syncs app state
- **Telegram Notifications**: Sends formatted notifications for all status changes
- **Modular Architecture**: Clean, extensible code structure
- **Comprehensive Logging**: Winston-based logging with file and console output
- **Error Handling**: Robust retry logic and error recovery
- **Graceful Shutdown**: Proper signal handling and cleanup

## 📋 Requirements

- Node.js 16+
- Cloudflare API Token with Zone:Zone:Edit permissions
- Telegram Bot Token
- VPS or server with systeminformation support

## 🛠️ Installation

1. **Clone or download the project**

   ```bash
   git clone <repository-url>
   cd vps-cpu-monitor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
CLOUDFLARE_DEFAULT_SECURITY_LEVEL=medium

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Monitoring Configuration
CPU_THRESHOLD=80
HIGH_CPU_DURATION=15
COOLDOWN_PERIOD=60
NORMAL_CPU_COOLDOWN=300
MONITORING_INTERVAL=5

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/monitor.log
```

### Configuration Details

| Variable                            | Default            | Description                                                |
| ----------------------------------- | ------------------ | ---------------------------------------------------------- |
| `CPU_THRESHOLD`                     | 80                 | CPU percentage threshold to trigger protection             |
| `HIGH_CPU_DURATION`                 | 15                 | Seconds of high CPU before enabling Under Attack mode      |
| `COOLDOWN_PERIOD`                   | 60                 | Seconds of normal CPU before disabling Under Attack mode   |
| `NORMAL_CPU_COOLDOWN`               | 300                | Extended cooldown period after CPU returns to normal       |
| `MONITORING_INTERVAL`               | 5                  | Seconds between CPU checks                                 |
| `CLOUDFLARE_DEFAULT_SECURITY_LEVEL` | medium             | Security level to restore when disabling Under Attack mode |
| `LOG_LEVEL`                         | info               | Logging level (error, warn, info, debug)                   |
| `LOG_TO_FILE`                       | true               | Enable file logging                                        |
| `LOG_FILE_PATH`                     | ./logs/monitor.log | Path to log file                                           |

### Cooldown Periods Explained

The application uses two different cooldown periods:

1. **`COOLDOWN_PERIOD` (60s)**: Legacy setting, kept for backward compatibility
2. **`NORMAL_CPU_COOLDOWN` (300s)**: **Active setting** - How long to wait after CPU returns to normal before disabling Under Attack mode

**Why the extended cooldown?** This prevents rapid on/off cycling of Under Attack mode during intermittent attacks or CPU spikes.

### Cloudflare Security Levels

Valid values for `CLOUDFLARE_DEFAULT_SECURITY_LEVEL`:

- `essentially_off` - No security
- `low` - Low security
- `medium` - Medium security (recommended default)
- `high` - High security
- `under_attack` - Maximum protection (used automatically)

## 🔧 Setup Instructions

### 1. Cloudflare Setup

1. **Get API Token**:

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Create new token with "Zone:Zone:Edit" permissions
   - Copy the token to `CLOUDFLARE_API_TOKEN`

2. **Get Zone ID**:

   - Go to your domain's Cloudflare dashboard
   - Copy the Zone ID from the right sidebar
   - Add to `CLOUDFLARE_ZONE_ID`

3. **Set Default Security Level**:
   - Choose your preferred default security level
   - Set `CLOUDFLARE_DEFAULT_SECURITY_LEVEL` (recommended: `medium`)

### 2. Telegram Bot Setup

1. **Create Bot**:

   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command and follow instructions
   - Copy the bot token to `TELEGRAM_BOT_TOKEN`

2. **Get Chat ID**:
   - Message your bot or add it to a group
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID in the response
   - Add to `TELEGRAM_CHAT_ID`

## 🚀 Usage

### Start the Application

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### Example Output

```q
2024-01-15T10:30:00.000Z [info]: Starting VPS CPU Monitor Application...
2024-01-15T10:30:00.000Z [info]: Configuration: {
  cpuThreshold: 80,
  highCpuDuration: 15,
  cooldownPeriod: 60,
  normalCpuCooldown: 300,
  monitoringInterval: 5,
  defaultSecurityLevel: 'medium'
}
2024-01-15T10:30:00.000Z [info]: Initializing VPS Monitor...
2024-01-15T10:30:01.000Z [info]: Cloudflare API connection test successful
2024-01-15T10:30:01.000Z [info]: Telegram API connection test successful
2024-01-15T10:30:01.000Z [info]: Current Cloudflare security level: medium
2024-01-15T10:30:01.000Z [info]: Initialized with normal state
2024-01-15T10:30:02.000Z [info]: VPS Monitor initialized successfully
2024-01-15T10:30:02.000Z [info]: Starting VPS monitoring with 5s intervals
2024-01-15T10:30:02.000Z [info]: VPS monitoring started successfully
2024-01-15T10:30:02.000Z [info]: VPS CPU Monitor Application started successfully
2024-01-15T10:30:02.000Z [info]: Press Ctrl+C to stop the application

2024-01-15T10:30:07.000Z [debug]: Current CPU usage: 45%
2024-01-15T10:30:12.000Z [debug]: Current CPU usage: 85%
2024-01-15T10:30:12.000Z [info]: High CPU detected: 85%. Starting timer...
2024-01-15T10:30:17.000Z [debug]: Current CPU usage: 87%
2024-01-15T10:30:22.000Z [debug]: Current CPU usage: 89%
2024-01-15T10:30:27.000Z [warn]: CPU usage above 80% for 15 seconds. Triggering Under Attack mode.
2024-01-15T10:30:27.000Z [warn]: Enabling Under Attack mode - CPU: 89%, Duration: 15s
2024-01-15T10:30:28.000Z [warn]: Cloudflare Under Attack mode enabled
2024-01-15T10:30:28.000Z [info]: Telegram message sent successfully
2024-01-15T10:30:28.000Z [info]: Under Attack mode enabled successfully
```

### Telegram Notifications

The bot sends formatted messages for:

- 🚀 **Startup**: Application configuration and current Cloudflare status
- 🚨 **Under Attack Enabled**: When protection is activated
- ✅ **Under Attack Disabled**: When protection is deactivated
- ❌ **Errors**: When critical errors occur

## 📁 Project Structure

```
vps-cpu-monitor/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration management
│   ├── monitors/
│   │   ├── cpuMonitor.js      # CPU monitoring logic
│   │   └── vpsMonitor.js      # Main monitoring orchestrator
│   ├── services/
│   │   ├── cloudflareService.js # Cloudflare API integration
│   │   └── telegramService.js   # Telegram bot integration
│   ├── utils/
│   │   └── logger.js          # Winston logging utility
│   ├── test-connections.js    # Connection testing script
│   └── index.js               # Application entry point
├── logs/                      # Log files (created automatically)
├── package.json
├── env.example
├── setup.sh
├── vps-monitor.service        # Systemd service file
├── README.md
└── QUICK_START.md
```

## 🔍 Monitoring Logic

1. **Startup**: Check current Cloudflare security level and sync app state
2. **CPU Check**: Every 5 seconds, check current CPU usage
3. **High CPU Detection**: If CPU > 80% for 15+ seconds:
   - Enable Cloudflare "Under Attack" mode
   - Send Telegram notification
4. **Recovery**: When CPU returns to normal:
   - Wait 300 seconds (normal CPU cooldown period)
   - Disable "Under Attack" mode
   - Restore to configured default security level
   - Send Telegram notification

## 🛡️ Security Features

- **Environment Variables**: All sensitive data stored in `.env`
- **API Token Security**: Cloudflare tokens with minimal required permissions
- **State Synchronization**: App state matches Cloudflare state on startup
- **Extended Cooldown**: Prevents rapid cycling of Under Attack mode
- **Error Handling**: Comprehensive error catching and logging
- **Retry Logic**: Automatic retry for failed API calls
- **Graceful Shutdown**: Proper cleanup on application termination

## 🔧 Extending the Application

### Adding New Notification Channels

1. Create new service in `src/services/`
2. Implement `sendNotification()` method
3. Add to `VpsMonitor` class
4. Update configuration

### Adding New Monitoring Metrics

1. Extend `CpuMonitor` class
2. Add new monitoring logic
3. Update status handling in `VpsMonitor`

## 🐛 Troubleshooting

### Common Issues

1. **Cloudflare API Errors**:

   - Verify API token has correct permissions
   - Check Zone ID is correct
   - Ensure domain is active on Cloudflare

2. **Telegram Bot Issues**:

   - Verify bot token is correct
   - Check chat ID is valid
   - Ensure bot has permission to send messages

3. **CPU Monitoring Issues**:

   - Verify `systeminformation` package is installed
   - Check system permissions
   - Review log files for errors

4. **State Synchronization Issues**:

   - Check Cloudflare API connectivity
   - Verify security level values are valid
   - Review startup logs for state initialization

5. **Cooldown Issues**:
   - Check `NORMAL_CPU_COOLDOWN` setting
   - Verify the extended cooldown is working as expected
   - Review logs for cooldown timing

### Log Files

Logs are stored in `./logs/monitor.log` with detailed information about:

- CPU usage patterns
- API call results
- Error details
- Status changes
- State synchronization
- Cooldown periods

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review log files
3. Create an issue with detailed information
