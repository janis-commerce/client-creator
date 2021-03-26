'use strict';

const APITest = require('@janiscommerce/api-test');
const { Invoker } = require('@janiscommerce/lambda');
const Settings = require('@janiscommerce/settings');

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


const fakeDBSettings = require('./helpers/fake-db-settings');
const prepareFakeClient = require('./helpers/prepare-fake-client');

describe('Client Create API', () => {

	const clients = ['foo', 'bar'];

	const clientsToSave = clients.map(code => prepareFakeClient(code));

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
					clients
				);

				stopMock();
			}
		}, {
			description: 'Should save all the received new clients to clients DB when no settings found in file',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clients.map(code => prepareFakeClient(code, false, false)));

				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients
				);

				stopMock();
			}
		}, {
			description: 'Should save clients after fetching database credentials',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

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
		}, {
			description: 'Should skip fetching credentials if environment is local',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

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
		}, {
			description: 'Should save clients when SecretsManager throws an Error',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

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
		}, {
			description: 'Should save clients when SecretsManager getValue rejects',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

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
		}, {
			description: 'Should return 500 when the client model multiSave fails',
			request: {
				data: { clients }
			},
			response: { code: 500 },
			before: sandbox => {

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

				wrongMockModelClient();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();
			},
			after: (res, sandbox) => {

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);

				stopMock();

				assertSecretsGet(sandbox, janisServiceName);
			}
		}
	]);
});
