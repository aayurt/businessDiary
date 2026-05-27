module.exports = {
  apps: [
    {
      name: 'business-diary',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=300',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
