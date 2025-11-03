module.exports = {
  apps: [
    {
      name: 'battleship-telegram',
      script: 'dist/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // Отслеживание изменений и автоматический рестарт (только для продакшена с авто-деплоем)
      ignore_watch: ['node_modules', 'logs', '*.db', 'frontend'],
    },
  ],
};

