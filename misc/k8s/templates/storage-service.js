module.exports = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'storage' },
    name: 'storage'
  },
  spec: {
    ports: [{ name: '3000', port: 3000, targetPort: 3000 }],
    selector: { 'entropic-service': 'storage' }
  },
  status: { loadBalancer: {} }
};
