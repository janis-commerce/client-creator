'use strict';

const APITest = require('@janiscommerce/api-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const Settings = require('@janiscommerce/settings');
const ClientCreateAPI = require('../lib/api-create');
const ClientModel = require('../lib/model-client');

describe('APIs', () => {

	describe('Client Create API', () => {

		const fakeSettings = {
			newClients: {
				host: 'some-database-host'
			}
		};

		const fakeFullSettings = {
			newClients: {
				host: 'some-database-host',
				protocol: 'some-protocol://',
				port: 27017,
				user: 'some-user',
				password: 'some-password'
			}
		};

		const expectedClientObject = {
			code: 'some-client',
			status: ClientModel.statuses.active,
			dbHost: fakeSettings.newClients.host,
			dbDatabase: 'janis-some-client'
		};

		const expectedFullClientObject = {
			...expectedClientObject,
			dbProtocol: fakeFullSettings.newClients.protocol,
			dbPort: fakeFullSettings.newClients.port,
			dbUser: fakeFullSettings.newClients.user,
			dbPassword: fakeFullSettings.newClients.password
		};

		APITest(ClientCreateAPI, '/api/client', [

			{
				description: 'Should save all the received new clients to clients DB',
				request: {
					data: {
						clients: [
							'some-client',
							'other-client'
						]
					}
				},
				response: {
					code: 200
				},
				before: sandbox => {

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnce(ClientModel.prototype.multiSave);
					sandbox.assert.calledWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject,
						{
							...expectedClientObject,
							code: 'other-client',
							dbDatabase: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientDatabases);
				}
			},
			{
				description: 'Should save all the received new clients to clients DB with full database config',
				request: {
					data: {
						clients: [
							'some-client',
							'other-client'
						]
					}
				},
				response: {
					code: 200
				},
				before: sandbox => {

					sandbox.stub(Settings, 'get')
						.returns(fakeFullSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnce(ClientModel.prototype.multiSave);
					sandbox.assert.calledWithExactly(ClientModel.prototype.multiSave, [
						expectedFullClientObject,
						{
							...expectedFullClientObject,
							code: 'other-client',
							dbDatabase: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientDatabases);
				}
			},
			{
				description: 'Should return 500 when the client model multiSave fails',
				request: {
					data: {
						clients: ['some-client']
					}
				},
				response: {
					code: 500
				},
				before: sandbox => {

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.throws();

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnce(ClientModel.prototype.multiSave);
					sandbox.assert.calledWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject
					]);

					sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientDatabases);
				}
			},
			{
				description: 'Should return 500 when the index creator fails',
				request: {
					data: {
						clients: ['some-client']
					}
				},
				response: {
					code: 500
				},
				before: sandbox => {

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves();

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.throws();
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnce(ClientModel.prototype.multiSave);
					sandbox.assert.calledWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject
					]);

					sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientDatabases);
				}
			},
			{
				description: 'Should return 400 when the received request data is invalid',
				request: {
					data: ['something']
				},
				response: {
					code: 400
				}
			},
			{
				description: 'Should return 400 when the received clients are invalid',
				request: {
					data: {
						clients: { some: 'object' }
					}
				},
				response: {
					code: 400
				}
			}
		]);
	});
});
