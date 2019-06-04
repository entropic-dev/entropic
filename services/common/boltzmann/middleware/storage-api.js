'use strict'

module.exports = createStorageApi

const StorageAPI = require('../client')

function createStorageApi ({
  url = process.env.STORAGE_API_URL || 'http://localhost:3002'
} = {}) {
  return next => {
    return async function (context) {
      context.storageApi = new StorageAPI({
        url,
        requestId: context.id,
        logger: context.logger('storage-api')
      })

      return next(context)
    }
  }
}
