module.exports = {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'storage' },
    name: 'storage'
  },
  spec: {
    replicas: 1,
    strategy: { type: 'Recreate' },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: { 'entropic-service': 'storage' }
      },
      spec: {
        containers: [
          {
            args: ['npm', 'start'],
            env: [
              'CACHE_DIR',
              'DEV_LATENCY_ERROR_MS',
              'EXTERNAL_HOST',
              'NODE_ENV',
              'OAUTH_GITHUB_CLIENT',
              'OAUTH_GITHUB_SECRET',
              'OAUTH_PASSWORD',
              'PGDATABASE',
              'PGHOST',
              'PGUSER',
              'SESSION_EXPIRY_SECONDS',
              'SESSION_SECRET',
              'STORAGE_API_URL'
            ].map(name => ({
              name,
              valueFrom: {
                configMapKeyRef: {
                  key: name,
                  name: 'entropic-env'
                }
              }
            })),
            image: 'entropicdev/storage:latest',
            imagePullPolicy: 'Always',
            name: 'storage',
            ports: [{ containerPort: 3000 }],
            resources: {},
            volumeMounts: [{ mountPath: '/var/cache/entropic', name: 'storage-claim' }],
            workingDir: '/services/storage'
          }
        ],
        volumes: [
          {
            name: 'storage-claim',
            persistentVolumeClaim: { claimName: 'storage-claim' }
          }
        ],
        restartPolicy: 'Always'
      }
    }
  },
  status: {}
};
