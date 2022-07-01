'use strict';

const MicroserviceCall = require('@janiscommerce/microservice-call');

module.exports = async clientCodes => {

	const msCall = new MicroserviceCall();

	const { statusCode, body } = await msCall.safeList('id', 'client', { filters: { code: clientCodes } }, {}, clientCodes.length);

	if(statusCode >= 500) {
		const errorMessage = body && body.message ? `${body.message}` : 'Service failed';
		throw new Error(`Failed to get Janis ID clients: ${errorMessage}`);
	}

	return statusCode < 400 && body.length && body;
};
