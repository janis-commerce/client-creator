'use strict';

const APITest = require('@janiscommerce/api-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const Settings = require('@janiscommerce/settings');
const mockRequire = require('mock-require');
const path = require('path');
const ClientCreateAPI = require('../lib/api-create');
const ClientModel = require('../lib/model-client');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
const fakeWrongClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'client');

describe('APIs', () => {

	describe('Client Create API', () => {

		const fakeSettings = {
			newClients: {
				host: 'some-database-host'
			},
			otherDb: {
				host: 'other-database-host'
			}
		};

		const fakeFullSettings = {
			newClients: {
				host: 'some-database-host',
				protocol: 'some-protocol://',
				port: 27017,
				user: 'some-user',
				password: 'some-password'
			},
			otherDb: {
				host: 'other-database-host',
				protocol: 'other-protocol://',
				port: 27017,
				user: 'other-user',
				password: 'other-password'
			}
		};

		const expectedClientObject = {
			code: 'some-client',
			status: ClientModel.statuses.active,
			dbHost: fakeSettings.newClients.host,
			dbDatabase: 'janis-some-client'
		};

		const expectedOtherClientObject = {
			...expectedClientObject,
			dbHost: fakeSettings.otherDb.host
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
				session: true,
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

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();

					sandbox.spy(ClientCreateAPI.prototype, 'postSaveHook');
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject,
						{
							...expectedClientObject,
							code: 'other-client',
							dbDatabase: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnceWithExactly(ClientCreateAPI.prototype.postSaveHook, ['some-client', 'other-client'], fakeSettings.newClients);
					mockRequire.stop(fakeClientPath);
				}
			},
			{
				description: 'Should save all the received new clients to clients DB with full database config',
				session: true,
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

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.returns(fakeFullSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();

					sandbox.spy(ClientCreateAPI.prototype, 'postSaveHook');
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						expectedFullClientObject,
						{
							...expectedFullClientObject,
							code: 'other-client',
							dbDatabase: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientDatabases);

					sandbox.assert.calledOnceWithExactly(ClientCreateAPI.prototype.postSaveHook, ['some-client', 'other-client'], fakeFullSettings.newClients);
					mockRequire.stop(fakeClientPath);
				}
			},
			{
				description: 'Should save all the received new clients to clients DB using a different db config',
				session: true,
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

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(ClientCreateAPI.prototype, 'databaseSettingsSource')
						.get(() => 'otherDb');

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();

					sandbox.spy(ClientCreateAPI.prototype, 'postSaveHook');
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						expectedOtherClientObject,
						{
							...expectedOtherClientObject,
							code: 'other-client',
							dbDatabase: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnceWithExactly(ClientCreateAPI.prototype.postSaveHook, ['some-client', 'other-client'], fakeSettings.otherDb);
					mockRequire.stop(fakeClientPath);
				}
			},
			{
				description: 'Should return 500 when the client model multiSave fails',
				session: true,
				request: {
					data: {
						clients: ['some-client']
					}
				},
				response: {
					code: 500
				},
				before: sandbox => {

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.rejects();

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();
				},
				after: (res, sandbox) => {

					mockRequire.stop(fakeClientPath);
					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject
					]);
					sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientDatabases);
				}
			},
			{
				description: 'Should return 500 when the index creator fails',
				session: true,
				request: {
					data: {
						clients: ['some-client']
					}
				},
				response: {
					code: 500
				},
				before: sandbox => {

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves();

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.rejects();
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						expectedClientObject
					]);

					sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientDatabases);
					mockRequire.stop(fakeClientPath);
				}
			},
			{
				description: 'Should return 400 when the received request data is invalid',
				session: true,
				request: {
					data: ['something']
				},
				response: {
					code: 400
				}
			},
			{
				description: 'Should return 400 when the received clients are invalid',
				session: true,
				request: {
					data: {
						clients: { some: 'object' }
					}
				},
				response: {
					code: 400
				}
			},
			{
				description: 'Should return 400 when the client model is not in the corresponding path',
				session: true,
				request: {
					data: {
						clients: [
							'some-client',
							'other-client'
						]
					}
				},
				response: {
					code: 500
				},
				before: sandbox => {

					mockRequire(fakeWrongClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.returns(fakeSettings);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();
				},
				after: (res, sandbox) => {

					sandbox.assert.notCalled(ClientModel.prototype.multiSave);
					sandbox.assert.notCalled(ClientModel.prototype.multiSave);
					sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientDatabases);
					mockRequire.stop(fakeClientPath);
				}
			}
		]);
	});
});
