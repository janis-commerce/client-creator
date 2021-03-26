'use strict';

const mockRequire = require('mock-require');
const path = require('path');

const { ModelClient } = require('../../lib');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
const fakeWrongClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'client');

const mockModelClient = () => {
	mockRequire(fakeClientPath, ModelClient);
};

const wrongMockModelClient = () => {
	mockRequire(fakeWrongClientPath, ModelClient);
};

const stopMock = () => {
	mockRequire.stopAll();
};

module.exports = {
	mockModelClient,
	wrongMockModelClient,
	stopMock
};
