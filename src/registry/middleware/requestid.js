'use strict';

const uuid = require('uuid');

module.exports = mw;

function mw(next) {
	return async function inner(request) {
		request.id = uuid.v1()
		const response = await next(request);
		return response;
	}
}
