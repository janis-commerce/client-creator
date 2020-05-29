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

			database: {
				core: {
					host: 'core-database-host',
					protocol: 'core-protocol://',
					port: 27017,
					user: 'core-user',
					password: 'core-password'
				},
				newClients: {
					host: 'some-database-host',
					protocol: 'some-protocol://',
					port: 27017,
					user: 'some-user',
					password: 'some-password',
					database: 'janis-{{code}}'
				}
			},
			clients: {
				newClientsDatabaseKey: 'newClients'
			}
		};

		const expectedClientObject = {
			code: 'some-client',
			status: ClientModel.statuses.active,
			...fakeSettings.database.newClients,
			database: 'janis-some-client'
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

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.callsFake(setting => fakeSettings[setting]);

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
							database: 'janis-other-client'
						}
					]);

					sandbox.assert.calledOnceWithExactly(
						ClientCreateAPI.prototype.postSaveHook,
						['some-client', 'other-client'],
						fakeSettings.database.newClients
					);

					mockRequire.stop(fakeClientPath);
				}
			},
			{
				description: 'Should save all the received new clients without database settings to clients DB without newClients Settings',
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

					const fakeSettings2 = {

						database: {
							core: {
								host: 'core-database-host',
								protocol: 'core-protocol://',
								port: 27017,
								user: 'core-user',
								password: 'core-password'
							}
						}
					};

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.callsFake(setting => fakeSettings2[setting]);

					sandbox.stub(ClientModel.prototype, 'multiSave')
						.resolves(true);

					sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientDatabases')
						.resolves();

					sandbox.spy(ClientCreateAPI.prototype, 'postSaveHook');
				},
				after: (res, sandbox) => {

					sandbox.assert.calledOnceWithExactly(ClientModel.prototype.multiSave, [
						{
							code: 'some-client',
							status: ClientModel.statuses.active
						},
						{
							code: 'other-client',
							status: ClientModel.statuses.active
						}
					]);

					sandbox.assert.calledOnceWithExactly(
						ClientCreateAPI.prototype.postSaveHook,
						['some-client', 'other-client'],
						undefined
					);

					mockRequire.stop(fakeClientPath);
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

					mockRequire(fakeClientPath, ClientModel);

					sandbox.stub(Settings, 'get')
						.callsFake(setting => fakeSettings[setting]);

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
						.callsFake(setting => fakeSettings[setting]);

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
			},
			{
				description: 'Should return 400 when the client model is not in the corresponding path',
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
						.callsFake(setting => fakeSettings[setting]);

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
