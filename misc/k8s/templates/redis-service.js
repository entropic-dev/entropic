module.exports = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'redis' },
    name: 'redis'
  },
  spec: {
    ports: [{ name: '6379', port: 6379, targetPort: 6379 }],
    selector: { 'entropic-service': 'redis' }
  },
  status: { loadBalancer: {} }
};
