'use strict';

module.exports = createObjectStorageMW;

const ObjectStorage = require('../lib/object-storage');

function createObjectStorageMW(strategyName = 'FileSystemStrategy') {
  return next => {
    const strategy = new ObjectStorage[strategyName]();
    const storage = new ObjectStorage(strategy);

    return (context, ...args) => {
      context.storage = storage;
      return next(context, ...args);
    };
  };
}
