module.exports = {
  apps: [
    {
      name: 'business-diary',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: 'logs/pm2/err.log',
      out_file: 'logs/pm2/out.log',
      log_file: 'logs/pm2/combined.log',
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: 10000,
      max_memory_restart: '1G',
      watch: false,
      merge_logs: true,
      autorestart: true,
      kill_timeout: 5000,
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:user/business-diary.git',
      path: '/var/www/business-diary',
      'pre-setup': 'apt-get update && apt-get install -y nodejs npm',
      'post-setup': 'npm install && npm run build',
      'pre-deploy-local': "echo 'Deploying...'",
      'post-deploy': 'npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
    },
  },
};
