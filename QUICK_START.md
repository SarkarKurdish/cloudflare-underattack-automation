# 🚀 Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your credentials
```

## 3. Test Setup

```bash
npm run test:connections
```

## 4. Start Monitoring

```bash
npm start
```

## 🔧 Required Configuration

### Cloudflare Setup

1. Get API Token: https://dash.cloudflare.com/profile/api-tokens
   - Permissions: Zone:Zone:Edit
2. Get Zone ID: From your domain's Cloudflare dashboard
3. Add to `.env`:
   ```
   CLOUDFLARE_API_TOKEN=your_token_here
   CLOUDFLARE_ZONE_ID=your_zone_id_here
   CLOUDFLARE_DEFAULT_SECURITY_LEVEL=medium
   ```

### Telegram Setup

1. Create bot: Message @BotFather on Telegram
2. Get Chat ID: Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Add to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

## 📊 How It Works

1. **Startup**: Checks current Cloudflare security level and syncs app state
2. **Monitors CPU** every 5 seconds
3. **Triggers Protection** when CPU > 80% for 15+ seconds
4. **Enables Cloudflare "Under Attack"** mode
5. **Sends Telegram Alert** with details
6. **Recovers** after 300 seconds (5 minutes) of normal CPU
7. **Disables Protection** and restores to configured default level
8. **Sends Recovery Notification**

## 🕐 Cooldown Periods

- **High CPU Duration**: 15 seconds of high CPU before enabling Under Attack mode
- **Normal CPU Cooldown**: 300 seconds (5 minutes) of normal CPU before disabling Under Attack mode

**Why 5 minutes?** This prevents rapid on/off cycling during intermittent attacks or CPU spikes.

## 🛠️ Commands

- `npm start` - Start monitoring
- `npm run dev` - Development mode with auto-restart
- `npm run test:connections` - Test all connections
- `./setup.sh` - Automated setup (Linux/Mac)

## 📝 Example .env

```env
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_DEFAULT_SECURITY_LEVEL=medium
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
CPU_THRESHOLD=80
HIGH_CPU_DURATION=15
COOLDOWN_PERIOD=60
NORMAL_CPU_COOLDOWN=300
MONITORING_INTERVAL=5
```

## 🔒 Security Levels

When disabling Under Attack mode, the app restores to your configured default:

- `essentially_off` - No security
- `low` - Low security
- `medium` - Medium security (recommended)
- `high` - High security

## 🚨 Emergency Stop

Press `Ctrl+C` to stop monitoring gracefully.
