module.exports = {
  apps: [{
    name: '555results-api',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Restart strategy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_timeout: 1000,
  }]
};