/* eslint-env node, mocha */
'use strict';

const cachedEnv = process.env;
const assert = require("assert")

describe(__filename,()=>{
    it("configure has defaults",()=>{
        delete process.env.PORT;
        require('../lib/config')

        assert.strictEqual(process.env.PORT,3000)
        assert.strictEqual(process.env.EXTERNAL_HOST,'http://localhost:3000')
    })

    it("configure uses ENV value over default value.",()=>{
        process.env.PORT = 1337;
        require('../lib/config')

        assert.strictEqual(process.env.PORT,1337)
    })

    after(()=>{
        process.env = cachedEnv;
    })
})