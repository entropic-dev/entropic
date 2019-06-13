/**
 * Validates each command's provided options
 * 
 * // TODO: everything is marked as false
 *          as they're not finished.
 */
const validate = {
    accept: (opts) => {
        return {
            valid: !opts.as || (!opts.package && !opts.namespace),
            usage: "ds accept"
        }
    },
    build: (_args) => {
        return {
            valid: false,
            usage: "ds build"
        }
    },
    decline: (_args) => {
        return {
            valid: false,
            usage: "ds decline"
        }
    },
    download: (_args) => {
        return {
            valid: false,
            usage: "ds download"
        }
    },
    invitation: (_args) => {
        return {
            valid: false,
            usage: "ds invitation"
        }
    },
    invite: (_args) => {
        return {
            valid: false,
            usage: "ds invite"
        }
    },
    join: (_args) => {
        return {
            valid: false,
            usage: "ds join"
        }
    },
    maintainerships: (_args) => {
        return {
            valid: false,
            usage: "ds maintainerships"
        }
    },
    /**
     * 
     */
    members: (args) => {
        return {
            valid: !args || args.length !== 1,
            usage: "ds members <namespace|package>"
        }
    }
}

module.exports = validate;

