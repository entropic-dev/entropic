'use strict';

const EventEmitter = require('events');

/**
 * The purpose of the message broker is to
 * provide a produce-consume relationship between
 * messages that isn't tightly coupled to any sort
 * of logging implementation.
 */
class MessageBroker extends EventEmitter {}

/**
 * Message event constant to be used
 * when emitting events
 */
const MESSAGE_EVENTS = {
  INFO: 'INFO',
  ERROR: 'ERROR'
};

/**
 * Produces an instance of MessageBroker and binds
 * a logger to message events.
 *
 * @param {*} logger Inject a logger. Console, file,
 *            etc.
 */
const createMessageBroker = logger => {
  const broker = new MessageBroker();

  broker.on(MESSAGE_EVENTS.INFO, msg => {
    logger.log(msg);
  });

  broker.on(MESSAGE_EVENTS.ERROR, msg => {
    logger.error(msg);
  });

  return broker;
};

module.exports = {
  MessageBroker,
  MESSAGE_EVENTS,
  createMessageBroker
};
