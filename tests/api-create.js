'use strict';

require('lllog')('none');

const APITest = require('@janiscommerce/api-test');
const Settings = require('@janiscommerce/settings');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const { Invoker } = require('@janiscommerce/lambda');

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

	const clients = ['foo', 'bar'];

	const clientsToSave = clients.map(code => prepareFakeClient(code));
	const clientsToSaveWithAdditionalFields = clientsToSave.map(client => ({ ...client, extraField: 'some-data' }));

	const janisServiceName = 'some-service-name';
	process.env.JANIS_SERVICE_NAME = janisServiceName;

	APITest(APICreate, '/api/client', [
		{
			description: 'Should save all the received new clients to clients DB',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients,
					clientsToSave
				);

				stopMock();
			}
		},
		{
			description: 'Should save all the received new clients to clients DB including additional fields',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 200, body: clientsToSaveWithAdditionalFields });

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSaveWithAdditionalFields);
				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients,
					clientsToSaveWithAdditionalFields
				);

				stopMock();
			}
		},
		{
			description: 'Should save all the received new clients to clients DB when no settings found in file',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get')
					.returns();

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				const expectedClientsToSave = clients.map(code => prepareFakeClient(code, false, false));

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, expectedClientsToSave);
				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients,
					expectedClientsToSave
				);

				stopMock();
			}
		},
		{
			description: 'Should save clients after fetching database credentials',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox, {
					databases: {
						secureDB: {
							write: {
								host: 'secure-host',
								user: 'secure-user',
								password: 'secure-password'
							}
						}
					}
				});

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clients.map(code => prepareFakeClient(code, true)));

				stopMock();
			}
		},
		{
			description: 'Should skip fetching credentials if environment is local',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv('local');

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				stopMock();
			}
		},
		{
			description: 'Should save clients when SecretsManager throws an Error',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				secretThrows(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				stopMock();
			}
		},
		{
			description: 'Should save clients when SecretsManager getValue rejects',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				getValueRejects(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				stopMock();
			}
		},
		{
			description: 'Should return 200 when MicroserviceCall can\'t get clients from ID Service',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 400, body: {} });

				sandbox.spy(ModelClient.prototype, 'multiSave');
				sandbox.spy(Invoker, 'call');
				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);
				sandbox.assert.notCalled(APICreate.prototype.postSaveHook);

				stopMock();
			}
		}, {
			description: 'Should save only found clients when can\'t get all clients from ID service',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 200, body: [clientsToSave[0]] });

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [clientsToSave[0]]);
				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients,
					[clientsToSave[0]]
				);

				stopMock();
			}
		}, {
			description: 'Should return 200 when MicroserviceCall don\'t get any clients from ID Service',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 200, body: [] });

				sandbox.spy(ModelClient.prototype, 'multiSave');
				sandbox.spy(Invoker, 'call');
				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);
				sandbox.assert.notCalled(APICreate.prototype.postSaveHook);

				stopMock();
			}
		}, {
			description: 'Should return 500 when MicroserviceCall fails to get clients from ID Service',
			request: {
				data: { clients }
			},
			response: { code: 500, body: { message: 'Failed to get Janis ID clients: Service failed' } },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 500, body: {} });

				sandbox.spy(ModelClient.prototype, 'multiSave');
				sandbox.spy(Invoker, 'call');
				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);
				sandbox.assert.notCalled(APICreate.prototype.postSaveHook);

				stopMock();
			}
		}, {
			description: 'Should return 500 when MicroserviceCall fails to get clients from ID Service with API Error message',
			request: {
				data: { clients }
			},
			response: { code: 500, body: { message: 'Failed to get Janis ID clients: Some API Error' } },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: clients }, limit: clients.length })
					.resolves({ statusCode: 500, body: { message: 'Some API Error' } });

				sandbox.spy(ModelClient.prototype, 'multiSave');
				sandbox.spy(Invoker, 'call');
				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', {
					filters: { clientCode: clients },
					limit: clients.length
				});

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);
				sandbox.assert.notCalled(APICreate.prototype.postSaveHook);

				stopMock();
			}
		}, {
			description: 'Should return 500 when the client model multiSave fails',
			request: {
				data: { clients }
			},
			response: { code: 500 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.rejects();

				sandbox.stub(Invoker, 'call')
					.resolves();
			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				sandbox.assert.notCalled(Invoker.call);

				stopMock();
			}
		}, {
			description: 'Should return 500 when invoking the index creator lambda fails',
			request: {
				data: { clients }
			},
			response: { code: 500 },
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves();

				sandbox.stub(Invoker, 'call')
					.rejects();
			},
			after: (res, sandbox) => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				stopMock();
			}
		}, {
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
			before: sandbox => {

				delete ClientFormatter.settings;

				wrongMockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(ModelClient.prototype, 'multiSave');
				sandbox.spy(Invoker, 'call');
			},
			after: (res, sandbox) => {

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);

				stopMock();

				secretsNotCalled(sandbox);
			}
		}
	]);
});
