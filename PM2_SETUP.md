# PM2 Setup Guide

This application uses **PM2** (Process Manager 2) for process management and automatic restarts when CPU usage exceeds 70%.

## Installation

### 1. Install Dependencies
```bash
npm install
```

This will install PM2 as specified in `package.json`.

### 2. Install PM2 Globally (Optional but Recommended)
```bash
npm install -g pm2
```

## Starting the Application

### Start with PM2
```bash
npm start
```

This command starts the application using the configuration in `ecosystem.config.js`.

### Start in Development Mode (Without PM2)
```bash
npm run dev
```

This runs `node index.js` directly - useful for development.

## PM2 Commands

### View Running Processes
```bash
pm2 list
```

### View Real-time Logs
```bash
npm run pm2:logs
```

Or manually:
```bash
pm2 logs tech
```

### Stop the Application
```bash
npm run pm2:stop
```

### Restart the Application
```bash
npm run pm2:restart
```

### Kill All PM2 Processes
```bash
npm run pm2:kill
```

## How CPU Monitoring & Auto-Restart Works

1. **CPU Monitoring Service** (`services/cpumonitor.js`)
   - Monitors CPU usage every 5 seconds
   - Threshold: 70% (configurable in `cpumonitor.js`)
   - When CPU ≥ 70%, server exits with code 1

2. **PM2 Auto-Restart**
   - Detects process exit
   - Automatically restarts the application
   - Configuration in `ecosystem.config.js`:
     - `autorestart: true` - Auto restart on crash
     - `max_memory_restart: "500M"` - Restart if memory exceeds 500MB
     - `max_restarts: 10` - Max restarts before giving up
     - `min_uptime: "10s"` - Minimum uptime required

## Log Files

Logs are stored in the `logs/` directory:
- **error.log** - Error messages only
- **out.log** - Standard output messages
- **combined.log** - Combined error and output

View logs in real-time:
```bash
pm2 logs tech
```

View specific log file:
```bash
tail -f logs/combined.log
```

## Example Output

When CPU usage exceeds 70%:
```
[CPU Monitor] Current Usage: 45.23%
[CPU Monitor] Current Usage: 52.15%
[CPU Monitor] Current Usage: 71.89%
[ALERT] CPU usage exceeded 70% (71.89%) - Server will restart via PM2

App <tech> exited with code 1 via signal SIGTERM
App <tech> restarted
```

## Configuration

Edit `ecosystem.config.js` to customize:
- **CPU_THRESHOLD** - Change threshold in `services/cpumonitor.js`
- **CHECK_INTERVAL** - Change check frequency in `services/cpumonitor.js`
- **max_memory_restart** - Memory limit before auto-restart
- **max_restarts** - Maximum restart attempts
- **min_uptime** - Minimum time before considering restart stable

## Production Deployment

For production, use:
```bash
NODE_ENV=production npm start
```

Or manually:
```bash
NODE_ENV=production pm2 start ecosystem.config.js
```

## Monitoring Dashboard (Optional)

Monitor processes with PM2 Plus Dashboard:
```bash
pm2 plus
```

## Troubleshooting

### PM2 command not found
```bash
npm install -g pm2
```

### See what's happening
```bash
pm2 logs tech
```

### Process keeps restarting
Check logs for errors:
```bash
pm2 logs tech --err
```

### Reset all PM2 data
```bash
pm2 flush
```

## Integration with System (Optional)

Make the app start on system reboot:
```bash
pm2 startup
pm2 save
```

To remove:
```bash
pm2 unstartup
```
