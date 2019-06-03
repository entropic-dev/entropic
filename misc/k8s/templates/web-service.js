module.exports = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'web' },
    name: 'web'
  },
  spec: {
    ports: [{ name: '3001', port: 3001, targetPort: 3001 }],
    selector: { 'entropic-service': 'web' }
  },
  status: { loadBalancer: {} }
};
