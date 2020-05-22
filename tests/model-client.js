'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const Settings = require('@janiscommerce/settings');

const ClientModel = require('../lib/model-client');

describe('ClientModel', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('Getters', () => {

		it('should return the core as databaseKey when is not set in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({});

			const clientModel = new ClientModel();

			assert.deepStrictEqual(clientModel.databaseKey, 'core');
		});

		it('should return the databaseKey setted in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({
					databaseKey: 'some-databaseKey'
				});

			const clientModel = new ClientModel();

			assert.deepStrictEqual(clientModel.databaseKey, 'some-databaseKey');
		});

		it('should return the newClients as databaseKey for new clients when is not set in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({});

			const clientModel = new ClientModel();

			assert.deepStrictEqual(clientModel.newClientsDatabaseKey, 'newClients');
		});

		it('should return the new clients databaseKey setted in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({
					newClientsDatabaseKey: 'some-databaseKey'
				});

			const clientModel = new ClientModel();

			assert.deepStrictEqual(clientModel.newClientsDatabaseKey, 'some-databaseKey');
		});

		it('should return clients as table name when is not set in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({});

			assert.deepStrictEqual(ClientModel.table, 'clients');
		});

		it('should return the table name setted in settings', () => {

			sandbox.stub(Settings, 'get')
				.returns({
					table: 'some-table'
				});

			assert.deepStrictEqual(ClientModel.table, 'some-table');
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
