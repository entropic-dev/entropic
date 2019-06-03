module.exports = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'registry' },
    name: 'registry'
  },
  spec: {
    type: 'NodePort',
    ports: [{ name: '3000', port: 3000, targetPort: 3000, nodePort: 30303 }],
    selector: { 'entropic-service': 'registry' }
  },
  status: { loadBalancer: {} }
};
