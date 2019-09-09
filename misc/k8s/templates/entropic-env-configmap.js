module.exports = {
  apiVersion: 'v1',
  data: {
    CACHE_DIR: '/var/cache/entropic',
    DEV_LATENCY_ERROR_MS: '10000',
    SESSION_EXPIRY_SECONDS: '31536000',
    STORAGE_API_URL: 'http://storage:3002',

    // You'll want to change this
    EXTERNAL_HOST: 'http://localhost:3000',
    NODE_ENV: 'production',

    // You'll need to change these, too
    OAUTH_GITHUB_CLIENT: 'gh_client_id_here',
    OAUTH_GITHUB_SECRET: 'gh_secret_here',
    OAUTH_PASSWORD: 'pw_for_encrypting_tokens_here',
    SESSION_SECRET: 'long_pw_for_encrypting_sessions_here',

    // Change this
    WEB_HOST: 'http://localhost:3001',

    // Provide these
    PGDATABASE: 'entropic_dev',
    PGHOST: 'db',
    PGUSER: 'postgres',
    POSTGRES_URL: 'postgres://postgres@db:5432',

    // If you're using hosted/external Redis, change this
    REDIS_URL: 'redis://redis:6379'
  },
  kind: 'ConfigMap',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'entropic-env' },
    name: 'entropic-env'
  }
};
