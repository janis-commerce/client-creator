'use strict';

const assert = require('assert');

const ClientModel = require('../lib/model-client');

describe('ClientModel', () => {

	describe('Getters', () => {

		it('Should return the databaseKey', () => {
			assert.strictEqual(ClientModel.prototype.databaseKey, 'core');
		});

		it('Should return collection name when table getter is used', () => {
			assert.strictEqual(ClientModel.table, 'clients');
		});

		it('Should return indexes when indexes getter is used', () => {
			assert(Array.isArray(ClientModel.indexes));
		});

		it('Should return the exclude fields for logging', async () => {
			assert.deepStrictEqual(ClientModel.excludeFieldsInLog, ['databases']);
		});

		it('Should return false when shouldCreateLogs', () => {
			assert.deepStrictEqual(ClientModel.shouldCreateLogs, false);
		});

	});
});
