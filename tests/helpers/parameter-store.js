'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { mockClient } = require('aws-sdk-client-mock');

let ssmClientMock;

const mock = () => {
	if(!ssmClientMock)
		ssmClientMock = mockClient(SSMClient);
};

module.exports.stubParameterResolves = parameter => {

	mock();

	ssmClientMock
		.on(GetParameterCommand)
		.resolves({ Parameter: { Value: JSON.stringify(parameter) } });
};

module.exports.stubParameterNotFound = () => {

	mock();

	ssmClientMock
		.on(GetParameterCommand)
		.rejects(new Error('Parameter not found', { code: 'ParameterNotFound' }));
};

module.exports.resetSSMMock = () => {
	mock();
	ssmClientMock.reset();
};
