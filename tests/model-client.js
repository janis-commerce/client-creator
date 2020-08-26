'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const ClientModel = require('../lib/model-client');

describe('ClientModel', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('Getters', () => {

		it('Should return collection name when table getter is used', () => {
			assert.equal(ClientModel.table, 'clients');
		});

		it('Should return indexes when indexes getter is used', () => {
			assert(Array.isArray(ClientModel.indexes));
		});

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
