module.exports = {
  apps: [
    {
      name: "tech",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 5000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      },
      // Auto restart on crash
      autorestart: true,
      // Max memory allowed before restart
      max_memory_restart: "500M",
      // Watch for file changes in development
      watch: false,
      // Ignore certain files from watch
      ignore_watch: ["node_modules", "uploads", "logs"],
      // Max restarts before giving up
      max_restarts: 10,
      // Time window for max_restarts
      min_uptime: "10s",
      // Graceful shutdown timeout
      kill_timeout: 5000,
      // Listen for unexpected exit
      listen_timeout: 3000,
      // Error log
      error_file: "./logs/error.log",
      // Output log
      out_file: "./logs/out.log",
      // Combined log
      log_file: "./logs/combined.log",
      // Log date format
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
