'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const ClientModel = require('../lib/model-client');

describe('ClientModel', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('Getters', () => {

		it('Should return the uniqueIndexes', async () => {
			assert.deepStrictEqual(ClientModel.uniqueIndexes, ['code']);
		});

		it('Should return the exclude fields for logging', async () => {
			assert.deepStrictEqual(ClientModel.excludeFieldsInLog, ['databases']);
		});

		it('Should return false when shouldCreateLogs', () => {
			assert.deepStrictEqual(ClientModel.shouldCreateLogs, false);
		});
	});
});
