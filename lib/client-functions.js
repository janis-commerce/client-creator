'use strict';

const path = require('path');

const modelPath = path.join(process.env.MS_PATH || '', 'models', 'client.js');

module.exports = [

	['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'created',
		mustHaveClient: false,
		timeout: 60,
		package: {
			include: [modelPath]
		}
  }],
  
  ['janis.eventListener', {
		serviceName: 'id',
		entityName: 'client',
		eventName: 'updated',
		mustHaveClient: false,
		timeout: 60,
		package: {
			include: [modelPath]
		}
  }],

	['janis.apiPost', {
		entityName: 'client',
		authorizer: 'ServiceNoClientAuthorizer',
		timeout: 60
	}]
];
