'use strict';

const assert = require('assert');

const ClientModel = require('../lib/model-client');

describe('ClientModel', () => {

	describe('Getters', () => {

		it('should return the databaseKey', () => {
			assert.deepStrictEqual(ClientModel.prototype.databaseKey, 'newClients');
		});

		it('should return the table name', () => {
			assert.deepStrictEqual(ClientModel.table, 'clients');
		});

		it('Should return the uniqueIndexes', async () => {
			assert.deepStrictEqual(ClientModel.uniqueIndexes, [
				'id',
				'code'
			]);
		});

		it('Should return the exclude fields for logging', async () => {
			assert.deepStrictEqual(ClientModel.excludeFieldsInLog, ['dbUser', 'dbPassword', 'dbHost']);
		});

		it('Should return false when shouldCreateLogs', () => {
			assert.deepStrictEqual(ClientModel.shouldCreateLogs, false);
		});
	});
});
