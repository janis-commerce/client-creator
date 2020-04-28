'use strict';

const path = require('path');

const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

module.exports = [

	['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'created',
		mustHaveClient: false,
		timeout: 60,
		package: {
			include: ['schemas/mongo/**', modelPath]
		}
	}],

	['janis.apiPost', {
		entityName: 'client',
		authorizer: 'ServiceNoClientAuthorizer',
		timeout: 60,
		package: {
			include: ['schemas/mongo/**']
		}
	}]
];
