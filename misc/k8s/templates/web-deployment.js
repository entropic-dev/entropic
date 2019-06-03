module.exports = {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'web' },
    name: 'web'
  },
  spec: {
    replicas: 1,
    strategy: { type: 'Recreate' },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: { 'entropic-service': 'web' }
      },
      spec: {
        containers: [
          {
            args: ['npm', 'start'],
            env: [
              'EXTERNAL_HOST',
              'NODE_ENV',
              'OAUTH_GITHUB_CLIENT',
              'OAUTH_GITHUB_SECRET',
              'REDIS_URL',
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
            image: 'entropicdev/web:latest',
            imagePullPolicy: 'Always',
            name: 'web',
            ports: [{ containerPort: 3000 }],
            resources: {},
            workingDir: '/services/web'
          }
        ],
        restartPolicy: 'Always'
      }
    }
  },
  status: {}
};
