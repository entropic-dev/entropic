'use strict'

module.exports = dev

const hangWarning = Symbol('hang-stall')
const hangError = Symbol('hang-error')

function dev (
  nextName,
  warnAt = Number(process.env.DEV_LATENCY_WARNING_MS) || 500,
  errorAt = Number(process.env.DEV_LATENCY_ERROR_MS) || 2000
) {
  return function mw (next) {
    return async function inner (req) {
      if (req[hangWarning]) {
        clearTimeout(req[hangWarning])
      }
      req[hangWarning] = setTimeout(() => {
        console.error(`⚠️ Response from ${nextName} > ${warnAt}ms fetching "${req.method} ${req.url}".`)
        console.error(`\x1b[0;37m - (Tune timeout using DEV_LATENCY_WARNING_MS env variable.)\x1b[0;0m`)
      }, warnAt)

      if (req[hangError]) {
        clearTimeout(req[hangError])
      }
      req[hangError] = setTimeout(() => {
        console.error(`🛑 STALL: Response from ${nextName} > ${errorAt}ms: "${req.method} ${req.url}". (Tune timeout using DEV_LATENCY_ERROR_MS env variable.)`)
        console.error(`\x1b[0;37m - (Tune timeout using DEV_LATENCY_ERROR_MS env variable.)\x1b[0;0m`)
      }, errorAt)

      const response = await next(req)

      clearTimeout(req[hangWarning])
      req[hangWarning] = null

      clearTimeout(req[hangError])
      req[hangError] = null

      return response
    }
  }
}
