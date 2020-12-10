'use strict';

const path = require('path');

const modelPath = path.join(process.env.MS_PATH || '', 'models', 'client.js');

module.exports = [

	['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'created',
		mustHaveClient: false,
		timeout: 30,
		package: {
			include: [modelPath]
		}
	}],

	['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'updated',
		mustHaveClient: false,
		timeout: 30,
		package: {
			include: [modelPath]
		}
	}],

	['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'removed',
		mustHaveClient: true,
		timeout: 30,
		package: {
			include: [modelPath]
		}
	}],

	['janis.apiPost', {
		entityName: 'client',
		authorizer: 'ServiceNoClientAuthorizer',
		timeout: 30
	}]
];
