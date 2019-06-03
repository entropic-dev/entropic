module.exports = {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'redis' },
    name: 'redis'
  },
  spec: {
    replicas: 1,
    strategy: {},
    template: {
      metadata: {
        creationTimestamp: null,
        labels: { 'entropic-service': 'redis' }
      },
      spec: {
        containers: [
          {
            image: 'redis:alpine',
            name: 'redis',
            ports: [{ containerPort: 6379 }],
            resources: {}
          }
        ],
        restartPolicy: 'Always'
      }
    }
  },
  status: {}
};
