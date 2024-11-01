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

const { stubParameterNotFound, resetSSMMock, stubParameterResolves } = require('./helpers/parameter-store');

describe.only('Client Create API', () => {

	const clientCodes = ['client-a', 'client-b'];

	const idClients = clientCodes.map(code => prepareFakeClient(code, false, false));
	const clientsToSave = clientCodes.map(code => prepareFakeClient(code));

	const serviceName = 'some-service-name';
	const env = 'test';

	const databaseId1 = '6724c02bf89103b7316b2da7';
	const databaseId2 = '6724c05d620aeab6c2af0db1';
	const databaseId3 = '6724c1ab995be9408a3b6708';

	const getResolves = (sinon, {
		clients = [],
		currentClients = []
	}) => {

		sinon.stub(Invoker, 'serviceCall')
			.resolves({ statusCode: 200, payload: { items: clients } });

		sinon.stub(ModelClient.prototype, 'get')
			.resolves(currentClients);
	};

	const assertGetIDClients = (sinon, clientCodesToFilter = clientCodes) => {
		sinon.assert.calledWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { code: clientCodesToFilter },
			limit: clientCodesToFilter.length
		});
	};

	const assertGetCurrentClients = (sinon, clientCodesToFilter = clientCodes) => {
		sinon.assert.calledOnceWithExactly(ModelClient.prototype.get, {
			filters: { code: clientCodesToFilter },
			limit: clientCodesToFilter.length
		});
	};

	const commonBeforeEach = sinon => {
		setEnv(env);
		setJanisServiceName(serviceName);
		sinon.spy(APICreate.prototype, 'postSaveHook');
	};

	const commonAfterEach = () => {
		resetSSMMock();
		stopMock();
		restoreEnvs();
		ClientFormatter.restore();
	};

	const stubMongoDBIndexCreator = sinon => {
		sinon.stub(Invoker, 'call')
			.withArgs('MongoDBIndexCreator')
			.resolves();
	};

	const assertMongoDBIndexCreator = sinon => sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

	context('When AWS ParameterStore is used for db config', () => {
		ApiTest(APICreate, '/api/client', [
			{
				description: 'Should create clients using db config',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					mockModelClient();

					getResolves(sinon, {
						clients: clientCodes.map(code => prepareFakeClient(code, false, false))
					});

					stubParameterResolves({
						newClientsDatabases: { default: databaseId1, otherDb: databaseId2 }
					});

					sinon.stub(Settings, 'get').returns({});

					stubGetSecret(sinon); // secret {}

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					assertGetCurrentClients(sinon);
					assertGetIDClients(sinon);

					assertSecretsGet(sinon, serviceName);

					const formattedClients = [{
						code: clientCodes[0],
						status: idClients[0].status,
						db: {
							default: {
								id: databaseId1,
								database: `${serviceName}-${idClients[0].code}`
							},
							otherDb: {
								id: databaseId2,
								database: `${serviceName}-${idClients[0].code}`
							}
						},
						databases: {}
					}, {
						code: clientCodes[1],
						status: idClients[1].status,
						db: {
							default: {
								id: databaseId1,
								database: `${serviceName}-${idClients[1].code}`
							},
							otherDb: {
								id: databaseId2,
								database: `${serviceName}-${idClients[1].code}`
							}
						},
						databases: {}
					}];

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, formattedClients);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, clientCodes, formattedClients);

					commonAfterEach();
				}
			}, {
				description: 'Should update client and keep current config and add new one',
				request: {
					data: { clients: ['the-client', 'not-found-in-id-client'] }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					mockModelClient();

					const client = prepareFakeClient('the-client', false, false);

					getResolves(sinon, {
						clients: [client],
						currentClients: [{
							...client,
							db: {
								default: {
									id: databaseId2,
									database: 'custom-db-name-for-the-client'
								}
							}
						}]
					});

					stubParameterResolves({
						newClientsDatabases: { default: databaseId1, newDB: databaseId3 }
					});

					sinon.stub(Settings, 'get').returns({});

					stubGetSecret(sinon); // secret {}

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					assertGetIDClients(sinon, ['the-client', 'not-found-in-id-client']);
					assertGetCurrentClients(sinon, ['the-client']);

					assertSecretsGet(sinon, serviceName);

					const formattedClients = [{
						code: 'the-client',
						db: {
							default: {
								// config not changed from current
								id: databaseId2,
								database: 'custom-db-name-for-the-client'
							},
							newDB: {
								// new config added
								id: databaseId3,
								database: `${serviceName}-the-client`
							}
						},
						databases: {},
						status: ModelClient.statuses.active
					}];

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, formattedClients);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(
						APICreate.prototype.postSaveHook,
						['the-client'],
						formattedClients
					);

					commonAfterEach();
				}
			}, {
				description: 'Should update client migrating old config to new one (databases[key].write)',
				request: {
					data: { clients: ['the-client'] }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					mockModelClient();

					const client = prepareFakeClient('the-client', false, false);

					getResolves(sinon, {
						clients: [client],
						currentClients: [{
							...client,
							databases: {
								default: {
									write: {
										host: 'host.net',
										username: 'the-user',
										password: 'the-password',
										database: 'custom-db-name-for-the-client' // must be used!!!
									}
								}
							}
						}]
					});

					stubParameterResolves({
						newClientsDatabases: { default: databaseId1 }
					});

					sinon.stub(Settings, 'get').returns({});

					stubGetSecret(sinon); // secret {}

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					assertGetCurrentClients(sinon, ['the-client']);
					assertGetIDClients(sinon, ['the-client']);

					assertSecretsGet(sinon, serviceName);

					const formattedClients = [{
						code: 'the-client',
						db: {
							default: {
								// config not changed from current
								id: databaseId1,
								database: 'custom-db-name-for-the-client'
							}
						},
						databases: {},
						status: ModelClient.statuses.active
					}];

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, formattedClients);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, ['the-client'], formattedClients);

					commonAfterEach();
				}
			}, {
				description: 'Should update client migrating oldest config to new one (databases[key])',
				request: {
					data: { clients: ['the-client'] }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					mockModelClient();

					const client = prepareFakeClient('the-client', false, false);

					getResolves(sinon, {
						clients: [client],
						currentClients: [{
							...client,
							databases: {
								default: {
									host: 'host.net',
									username: 'the-user',
									password: 'the-password',
									database: 'custom-db-name-for-the-client' // must be used!!!
								}
							}
						}]
					});

					stubParameterResolves({
						newClientsDatabases: { default: databaseId1 }
					});

					sinon.stub(Settings, 'get').returns({});

					stubGetSecret(sinon); // secret {}

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					assertGetCurrentClients(sinon, ['the-client']);
					assertGetIDClients(sinon, ['the-client']);

					assertSecretsGet(sinon, serviceName);

					const formattedClients = [{
						code: 'the-client',
						db: {
							default: {
								// config not changed from current
								id: databaseId1,
								database: 'custom-db-name-for-the-client'
							}
						},
						databases: {},
						status: ModelClient.statuses.active
					}];

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, formattedClients);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, ['the-client'], formattedClients);

					commonAfterEach();
				}
			}
		]);
	});

	context('When AWS SecretsManager is used for db config', () => {

		const commonSMBefore = () => {
			stubParameterNotFound();
			mockModelClient();
		};

		ApiTest(APICreate, '/api/client', [
			{
				description: 'Should create/update the received clients in service core clients database',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients,
						currentClients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					stubGetSecret(sinon); // secret {}

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);

				},
				after: (res, sinon) => {

					assertGetCurrentClients(sinon);
					assertGetIDClients(sinon);

					assertSecretsGet(sinon, serviceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(APICreate.prototype.postSaveHook, clientCodes, clientsToSave);

					commonAfterEach();
				}
			}, {
				description: 'Should save all the received new clients to clients DB when no settings found in file',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get')
						.returns();

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					secretsNotCalled(sinon);

					const expectedClientsToSave = clientCodes.map(code => prepareFakeClient(code, false, false));

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, expectedClientsToSave);
					assertMongoDBIndexCreator(sinon);

					sinon.assert.calledOnceWithExactly(
						APICreate.prototype.postSaveHook,
						clientCodes,
						expectedClientsToSave
					);

					commonAfterEach();
				}
			}, {
				description: 'Should save clients after fetching database credentials',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

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

					stubMongoDBIndexCreator(sinon);

				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, serviceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientCodes.map(code => prepareFakeClient(code, true)));

					commonAfterEach();
				}
			}, {
				description: 'Should skip fetching credentials if environment is local',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					setEnv('local');

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);

				},
				after: (res, sinon) => {

					secretsNotCalled(sinon);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					commonAfterEach();
				}
			}, {
				description: 'Should save clients when SecretsManager throws an Error',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					secretThrows(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);

				},
				after: (res, sinon) => {
					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					commonAfterEach();
				}
			}, {
				description: 'Should save clients when SecretsManager getValue rejects',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 200 },
				before: sinon => {

					commonBeforeEach(sinon);

					commonSMBefore();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					getValueRejects(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					stubMongoDBIndexCreator(sinon);

				},
				after: (res, sinon) => {
					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					commonAfterEach();
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
				response: { code: 400 }
			}, {
				description: 'Should return 400 when the received clients are invalid',
				request: {
					data: {
						clients: { some: 'object' }
					}
				},
				response: { code: 400 }
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

					stubParameterNotFound();

					mockModelClient();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.rejects();

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, serviceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					sinon.assert.notCalled(Invoker.call);

					commonAfterEach();
				}
			}, {
				description: 'Should return 500 when invoking the index creator lambda fails',
				request: {
					data: { clients: clientCodes }
				},
				response: { code: 500 },
				before: sinon => {

					stubParameterNotFound();

					mockModelClient();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					stubGetSecret(sinon);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves(true);

					sinon.stub(Invoker, 'call')
						.rejects();
				},
				after: (res, sinon) => {

					assertSecretsGet(sinon, serviceName);

					sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
					assertMongoDBIndexCreator(sinon);

					commonAfterEach();
				}
			}, {
				description: 'Should return 500 when the client model is not in the corresponding path',
				request: {
					data: { clients: clientCodes }
				},
				response: {
					code: 500
				},
				before: sinon => {

					stubParameterNotFound();

					wrongMockModelClient();

					getResolves(sinon, {
						clients: idClients
					});

					sinon.stub(Settings, 'get').returns(fakeDBSettings);

					stubGetSecret(sinon);

					sinon.spy(ModelClient.prototype, 'multiSave');

					stubMongoDBIndexCreator(sinon);
				},
				after: (res, sinon) => {

					sinon.assert.notCalled(ModelClient.prototype.multiSave);
					sinon.assert.notCalled(Invoker.call);

					commonAfterEach();

					secretsNotCalled(sinon);
				}
			}
		]);
	});
});
