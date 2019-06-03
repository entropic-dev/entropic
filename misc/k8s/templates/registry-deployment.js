module.exports = {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'registry' },
    name: 'registry'
  },
  spec: {
    replicas: 1,
    strategy: { type: 'Recreate' },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: { 'entropic-service': 'registry' }
      },
      spec: {
        containers: [
          {
            args: ['npm', 'start'],
            env: [
              'DEV_LATENCY_ERROR_MS',
              'EXTERNAL_HOST',
              'NODE_ENV',
              'REDIS_URL',
              'SESSION_EXPIRY_SECONDS',
              'SESSION_SECRET',
              'STORAGE_API_URL',
              'WEB_HOST'
            ].map(name => ({
              name,
              valueFrom: {
                configMapKeyRef: {
                  key: name,
                  name: 'entropic-env'
                }
              }
            })),
            image: 'entropicdev/registry:latest',
            imagePullPolicy: 'Always',
            name: 'registry',
            ports: [{ containerPort: 3000 }],
            resources: {},
            workingDir: '/services/registry'
          }
        ],
        restartPolicy: 'Always'
      }
    }
  },
  status: {}
};
