'use strict';

require('lllog')('none');

const APITest = require('@janiscommerce/api-test');
const Settings = require('@janiscommerce/settings');

const { Invoker } = require('@janiscommerce/lambda');

const Model = require('@janiscommerce/model');

const { APICreate, ModelClient } = require('../lib');

const {
	stubGetSecret,
	secretThrows,
	getValueRejects,
	assertSecretsGet,
	secretsNotCalled,
	setEnv
} = require('./helpers/secrets-functions');

const {
	mockModelClient,
	wrongMockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

const ClientFormatter = require('../lib/helpers/client-formatter');

const fakeDBSettings = require('./helpers/fake-db-settings');
const prepareFakeClient = require('./helpers/prepare-fake-client');

describe('Client Create API', () => {

	const clients = ['client-a', 'client-b'];

	const idClients = clients.map(code => prepareFakeClient(code, false, false));
	const clientsToSave = clients.map(code => prepareFakeClient(code));

	const clientsToSaveWithAdditionalFields = [
		{ ...clientsToSave[0], extraField: 'some-data' },
		{ ...clientsToSave[1], extraField: 0 }
	];

	const janisServiceName = 'some-service-name';
	process.env.JANIS_SERVICE_NAME = janisServiceName;

	const getIDClientsResolves = (sinon, items = [], statusCode = 200) => {
		sinon.stub(Invoker, 'serviceCall')
			.resolves(({ statusCode, payload: { items } }));
	};

	const assertGetIDClients = sinon => {
		sinon.assert.calledOnceWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { code: clients },
			limit: 2
		});
	};

	const getClientsResolves = (sinon, items) => {
		sinon.stub(ModelClient.prototype, 'get')
			.resolves(items.map(([id, code, status]) => ({ id, code, status })));
	};

	context('When valid clients received', () => {
		APITest(APICreate, '/api/client', [
			{
				description: 'Should save all the received new clients to clients DB',
				request: {
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, clients, clientsToSave);

					stopMock();
				}
			}, {
				description: 'Should save all the received new clients to clients DB when no settings found in file',
				request: {
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get')
						.returns();

					setEnv();

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');

				},
				after: (res, sinon) => {

					secretsNotCalled(sinon);

					const expectedClientsToSave = clients.map(code => prepareFakeClient(code, false, false));

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, expectedClientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					sinon.assert.calledOnceWithExactly(
						APICreate.prototype.postSaveHook,
						clients,
						expectedClientsToSave
					);

					stopMock();
				}
			}, {
				description: 'Should save clients after fetching database credentials',
				request: {
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clients.map(code => prepareFakeClient(code, true)));

					stopMock();
				}
			}, {
				description: 'Should skip fetching credentials if environment is local',
				request: {
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

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
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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
					data: { clients }
				},
				response: { code: 200 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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

		context('When model has additionalFields', () => {
			APITest(APICreate, '/api/client', [
				{
					description: 'Should save all the received new clients to clients DB including additional fields',
					request: {
						data: { clients }
					},
					response: { code: 200 },
					before: sinon => {

						delete ClientFormatter.settings;

						mockModelClient();

						sinon.stub(ModelClient, 'additionalFields')
							.get(() => ['extraField']);

						sinon.stub(Settings, 'get').returns(fakeDBSettings);

						setEnv();

						stubGetSecret(sinon);

						getIDClientsResolves(sinon, clientsToSaveWithAdditionalFields);

						sinon.stub(ModelClient.prototype, 'multiSave')
							.resolves(true);

						sinon.stub(Invoker, 'call')
							.resolves();

						sinon.spy(APICreate.prototype, 'postSaveHook');

					},
					after: (res, sinon) => {

						assertSecretsGet(sinon, janisServiceName);

						assertGetIDClients(sinon);

						sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSaveWithAdditionalFields);
						sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

						sinon.assert.calledOnceWithExactly(
							APICreate.prototype.postSaveHook,
							clients,
							clientsToSaveWithAdditionalFields
						);

						stopMock();
					}
				}
			]);
		});

		describe('JanisID responses', () => {
			APITest(APICreate, '/api/client', [
				{
					description: 'Should return 200 when can\'t get clients in ID Service',
					request: {
						data: { clients }
					},
					response: { code: 200 },
					before: sinon => {

						delete ClientFormatter.settings;

						mockModelClient();

						sinon.stub(ModelClient, 'additionalFields')
							.get(() => ['extraField']);

						sinon.stub(Settings, 'get').returns(fakeDBSettings);

						setEnv();

						stubGetSecret(sinon);

						getIDClientsResolves(sinon, [], 400);

						sinon.spy(ModelClient.prototype, 'multiSave');
						sinon.spy(Invoker, 'call');
						sinon.spy(APICreate.prototype, 'postSaveHook');

					},
					after: (res, sinon) => {

						secretsNotCalled(sinon);

						assertGetIDClients(sinon);

						sinon.assert.notCalled(ModelClient.prototype.multiSave);
						sinon.assert.notCalled(Invoker.call);
						sinon.assert.notCalled(APICreate.prototype.postSaveHook);

						stopMock();
					}
				}, {
					description: 'Should save only found clients when can\'t get all clients from ID service',
					request: {
						data: { clients }
					},
					response: { code: 200 },
					before: sinon => {

						delete ClientFormatter.settings;

						mockModelClient();

						sinon.stub(ModelClient, 'additionalFields')
							.get(() => ['extraField']);

						sinon.stub(Settings, 'get').returns(fakeDBSettings);

						setEnv();

						stubGetSecret(sinon);

						getIDClientsResolves(sinon, [clientsToSave[0]]);

						sinon.stub(ModelClient.prototype, 'multiSave')
							.resolves(true);

						sinon.stub(Invoker, 'call')
							.resolves();

						sinon.spy(APICreate.prototype, 'postSaveHook');

					},
					after: (res, sinon) => {

						assertSecretsGet(sinon, janisServiceName);

						assertGetIDClients(sinon);

						sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [clientsToSave[0]]);
						sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

						sinon.assert.calledOnceWithExactly(
							APICreate.prototype.postSaveHook,
							clients,
							[clientsToSave[0]]
						);

						stopMock();
					}
				}, {
					description: 'Should return 200 when not found any clients in ID Service',
					request: {
						data: { clients }
					},
					response: { code: 200 },
					before: sinon => {

						delete ClientFormatter.settings;

						mockModelClient();

						sinon.stub(ModelClient, 'additionalFields')
							.get(() => ['extraField']);

						sinon.stub(Settings, 'get').returns(fakeDBSettings);

						setEnv();

						stubGetSecret(sinon);

						getIDClientsResolves(sinon);

						sinon.spy(ModelClient.prototype, 'multiSave');
						sinon.spy(Invoker, 'call');
						sinon.spy(APICreate.prototype, 'postSaveHook');

					},
					after: (res, sinon) => {

						secretsNotCalled(sinon);

						assertGetIDClients(sinon);

						sinon.assert.notCalled(ModelClient.prototype.multiSave);
						sinon.assert.notCalled(Invoker.call);
						sinon.assert.notCalled(APICreate.prototype.postSaveHook);

						stopMock();
					}
				}, {
					description: 'Should return 500 when fails getting clients from ID Service',
					request: {
						data: { clients }
					},
					response: {
						code: 500,
						body: { message: 'Failed to get Janis ID clients' }
					},
					before: sinon => {

						delete ClientFormatter.settings;

						mockModelClient();

						sinon.stub(ModelClient, 'additionalFields')
							.get(() => ['extraField']);

						sinon.stub(Settings, 'get').returns(fakeDBSettings);

						setEnv();

						stubGetSecret(sinon);

						getIDClientsResolves(sinon, null, 500);

						sinon.spy(ModelClient.prototype, 'multiSave');
						sinon.spy(Invoker, 'call');
						sinon.spy(APICreate.prototype, 'postSaveHook');

					},
					after: (res, sinon) => {

						secretsNotCalled(sinon);

						assertGetIDClients(sinon);

						sinon.assert.notCalled(ModelClient.prototype.multiSave);
						sinon.assert.notCalled(Invoker.call);
						sinon.assert.notCalled(APICreate.prototype.postSaveHook);

						stopMock();
					}
				}
			]);
		});

	});

	context('When processClients parameter received', () => {
		APITest(APICreate, '/api/client', [
			{
				description: 'Should create clients when not found in service',
				request: { data: { processClients: true } },
				response: {
					code: 200,
					body: {
						createdClients: idClients.map(({ code }) => code)
					}
				},
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

					stubGetSecret(sinon);

					getClientsResolves(sinon, []);

					getIDClientsResolves(sinon, idClients);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.resolves();

					sinon.spy(APICreate.prototype, 'postSaveHook');
					sinon.spy(APICreate.prototype, 'postUpdateHook');
					sinon.spy(APICreate.prototype, 'postRemoveHook');

				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, janisServiceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, clients, clientsToSave);

					sinon.assert.notCalled(APICreate.prototype.postUpdateHook);
					sinon.assert.notCalled(APICreate.prototype.postRemoveHook);

					stopMock();
				}
			}, {
				description: 'Should update clients when found in service',
				request: { data: { processClients: true } },
				response: {
					code: 200,
					body: {
						updatedClients: ['client-a', 'client-b']
					}
				},
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

					getClientsResolves(sinon, [
						['62f65ac3414d5da1e0f2bc5e', 'client-a', ModelClient.statuses.active],
						['62f65ad8b07cd614cdc9a0ed', 'client-b', ModelClient.statuses.active]
					]);

					getIDClientsResolves(sinon, idClients);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.spy(APICreate.prototype, 'postSaveHook');
					sinon.spy(APICreate.prototype, 'postUpdateHook');
					sinon.spy(APICreate.prototype, 'postRemoveHook');
				},
				after: (res, sinon) => {

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [{
						code: 'client-a', status: ModelClient.statuses.active
					}, {
						code: 'client-b', status: ModelClient.statuses.active
					}]);

					sinon.assert.notCalled(APICreate.prototype.postSaveHook);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postUpdateHook, [{
						code: 'client-a', databases: {}, status: ModelClient.statuses.active
					}, {
						code: 'client-b', databases: {}, status: ModelClient.statuses.active
					}]);

					sinon.assert.notCalled(APICreate.prototype.postRemoveHook);

					stopMock();
				}
			}, {
				description: 'Should remove clients when not found in service',
				request: { data: { processClients: true } },
				response: {
					code: 200,
					body: {
						removedClients: ['extra-client-a', 'extra-client-b']
					}
				},
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

					getClientsResolves(sinon, [
						['62f65ac3414d5da1e0f2bc5e', 'extra-client-a', ModelClient.statuses.active],
						['62f65ad8b07cd614cdc9a0ed', 'extra-client-b', ModelClient.statuses.active]
					]);

					getIDClientsResolves(sinon, []);

					sinon.stub(Model.prototype, 'dropDatabase')
						.resolves(true);

					sinon.stub(ModelClient.prototype, 'multiRemove')
						.resolves(true);

					sinon.spy(APICreate.prototype, 'postSaveHook');
					sinon.spy(APICreate.prototype, 'postUpdateHook');
					sinon.spy(APICreate.prototype, 'postRemoveHook');
				},
				after: (res, sinon) => {

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiRemove, {
						code: ['extra-client-a', 'extra-client-b']
					});

					sinon.assert.notCalled(APICreate.prototype.postSaveHook);

					sinon.assert.notCalled(APICreate.prototype.postUpdateHook);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postRemoveHook, ['extra-client-a', 'extra-client-b']);

					stopMock();
				}
			}
		]);
	});

	context('When invalid payload received', () => {
		APITest(APICreate, '/api/client', [
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
		APITest(APICreate, '/api/client', [
			{
				description: 'Should return 500 when the client model multiSave fails',
				request: {
					data: { clients }
				},
				response: { code: 500 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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
					data: { clients }
				},
				response: { code: 500 },
				before: sinon => {

					delete ClientFormatter.settings;

					mockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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

					delete ClientFormatter.settings;

					wrongMockModelClient();

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv();

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
