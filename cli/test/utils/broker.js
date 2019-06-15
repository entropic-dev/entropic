'use strict';

const { MessageBroker, MESSAGE_EVENTS } = require("../../lib/MessageBroker")

module.exports = {
    createFakeBroker
}

function createFakeBroker() {
    const broker = new MessageBroker();

    broker.message = [];
    broker.errors = [];

    broker.on(MESSAGE_EVENTS.INFO, msg => {
        broker.message.push(msg);
    });

    broker.on(MESSAGE_EVENTS.ERROR, msg => {
        broker.errors.push(msg);
    });

    return broker;
};
