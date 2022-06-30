'use strict';

const path = require('path');

/* istanbul ignore next */
const modelPath = path.join(process.env.MS_PATH || '', 'models', 'client.js');

const baseEvent = {
	serviceName: 'id',
	entityName: 'client',
	mustHaveClient: false,
	timeout: 30,
	package: { include: [modelPath] }
};

module.exports = [

	['janis.eventListener', {
		...baseEvent,
		eventName: 'created'
	}],

	['janis.eventListener', {
		...baseEvent,
		eventName: 'updated'
	}],

	['janis.eventListener', {
		...baseEvent,
		eventName: 'removed'
	}],

	['janis.apiPost', {
		entityName: 'client',
		authorizer: 'ServiceNoClientAuthorizer',
		timeout: 30
	}]
];
