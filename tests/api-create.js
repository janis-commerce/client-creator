'use strict';

require('lllog')('none');

const ApiTest = require('@janiscommerce/api-test');
const Settings = require('@janiscommerce/settings');

const { Invoker } = require('@janiscommerce/lambda');

const { APICreate, ModelClient } = require('../lib');

const {
	stubGetSecret,
	secretThrows,
	getValueRejects,
	assertSecretsGet,
	secretsNotCalled
} = require('./helpers/secrets-functions');

const {
	mockModelClient,
	wrongMockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

const ClientFormatter = require('../lib/helpers/client-formatter');

const fakeDBSettings = require('./helpers/fake-db-settings');
const prepareFakeClient = require('./helpers/prepare-fake-client');
const { setJanisServiceName, setEnv, restoreEnvs } = require('./helpers/utils');

describe.only('Client Create API', () => {

	const clientCodes = ['client-a', 'client-b'];

	const idClients = clientCodes.map(code => prepareFakeClient(code, false, false));
	const clientsToSave = clientCodes.map(code => prepareFakeClient(code));

	const service = {
		id: '65c4e5a304b7c5b6113b196a',
		code: 'my-service',
		clientDatabases: [{
			databaseKey: 'default',
			newClientsDatabase: '65c4e5c25176c8137df7d2e1'
		}]
	};

	const janisServiceName = 'some-service-name';
	const env = 'test';

	const getResolves = (sinon, {
		clients,
		currentClients,
		serviceFromDevops
	}) => {

		const serviceCallStub = sinon.stub(Invoker, 'serviceCall');

		serviceCallStub
			.onFirstCall()
			.resolves({ statusCode: 200, payload: { items: clients } });

		if(serviceFromDevops) {
			serviceCallStub
				.onSecondCall()
				.resolves({ statusCode: 200, payload: { items: [serviceFromDevops] } });
		}

		if(currentClients)
			sinon.stub(ModelClient.prototype, 'get').resolves(currentClients);
	};

	const assertGetIDClients = sinon => {
		sinon.assert.calledWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { code: clientCodes },
			limit: 2
		});
	};

	const assertGetCurrentClients = sinon => {
		sinon.assert.calledOnceWithExactly(ModelClient.prototype.get, {
			fields: ['code', 'databasesCredentials'],
			filters: { code: clientCodes },
			limit: clientCodes.length
		});
	};

	const assertGetService = sinon => {
		sinon.assert.calledWithExactly(Invoker.serviceCall, 'devops', 'GetService', {
			fields: ['id', 'code', 'clientDatabases'],
			filters: { code: janisServiceName },
			limit: 1
		});
	};

	context('When valid clients received', () => {
		ApiTest(APICreate, '/api/client', [
			{
				description: 'Should create/update the received clients in service core clients database',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				only: 1,
				before: sinon => {

					mockModelClient();

					getResolves(sinon, {
						clients: idClients,
						currentClients: idClients,
						serviceFromDevops: service
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setJanisServiceName(janisServiceName);

					setEnv(env);

					stubGetSecret(sinon); // not secret

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					assertGetCurrentClients(sinon);
					assertGetIDClients(sinon);
					assertGetService(sinon);

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, clientCodes, clientsToSave);

					stopMock();

					restoreEnvs();

					ClientFormatter.restore();
				}
			}, {
				description: 'Should save all the received new clients to clients DB when no settings found in file',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get')
						.returns();

					setEnv(env);

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					secretsNotCalled(sinon);

					const expectedClientsToSave = clientCodes.map(code => prepareFakeClient(code, false, false));

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, expectedClientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					sinon.assert.calledOnceWithExactly(
						APICreate.prototype.postSaveHook,
						clientCodes,
						expectedClientsToSave
					);

					stopMock();
				}
			}, {
				description: 'Should save clients after fetching database credentials',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					stubGetSecret(sinon, {
						databases: {
							secureDB: {
								write: { host: 'secure-host', user: 'secure-user', password: 'secure-password' },
								admin: { host: 'secure-host', user: 'secure-user', password: 'secure-password' }
							}
						}
					});

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientCodes.map(code => prepareFakeClient(code, true)));

					stopMock();
				}
			}, {
				description: 'Should skip fetching credentials if environment is local',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv('local');

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					secretsNotCalled(sinon);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					stopMock();
				}
			}, {
				description: 'Should save clients when SecretsManager throws an Error',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					secretThrows(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {
					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					stopMock();
				}
			}, {
				description: 'Should save clients when SecretsManager getValue rejects',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					getValueRejects(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {
					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					stopMock();
				}
			}
		]);

	});

	context('When invalid payload received', () => {
		ApiTest(APICreate, '/api/client', [
			{
				description: 'Should return 400 when the received request data is invalid',
				request: {
					data: ['something']
				},
				response: {
					code: 400
				}
			}, {
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

	describe('Errors', () => {
		ApiTest(APICreate, '/api/client', [
			{
				description: 'Should return 500 when the client model multiSave fails',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 500 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.rejects();

					sinon.stub(Invoker, 'call')
						.resolves();
				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.notCalled(Invoker.call);

					stopMock();
				}
			}, {
				description: 'Should return 500 when invoking the index creator lambda fails',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 500 },
				before: sinon => {


					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves();

					sinon.stub(Invoker, 'call')
						.rejects();
				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					stopMock();
				}
			}, {
				description: 'Should return 500 when the client model is not in the corresponding path',
				request: {
					data: {
						clients: ['some-client', 'other-client']
					}
				},
				response: {
					code: 500
				},
				before: sinon => {


					wrongMockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv(env);

					stubGetSecret(sinon);

					sinon.spy(ModelClient.prototype, 'multiSave');
					sinon.spy(Invoker, 'call');
				},
				after: (res, sinon) => {

					sinon.assert.notCalled(ModelClient.prototype.multiSave);
					sinon.assert.notCalled(Invoker.call);

					stopMock();

					secretsNotCalled(sinon);
				}
			}
		]);
	});
});
