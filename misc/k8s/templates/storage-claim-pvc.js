module.exports = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    creationTimestamp: null,
    labels: { 'entropic-service': 'storage-claim' },
    name: 'storage-claim'
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '100Mi' } }
  },
  status: {}
};
