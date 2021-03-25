'use strict';

const APITest = require('@janiscommerce/api-test');
const { Invoker } = require('@janiscommerce/lambda');
const Settings = require('@janiscommerce/settings');
const mockRequire = require('mock-require');
const path = require('path');

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');

const { APICreate, ModelClient } = require('../lib');
const CredentialsFetcher = require('../lib/helpers/credentials-fetcher');

const fakeDBSettings = require('./fake-db-settings');
const prepareFakeClient = require('./prepare-fake-client');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
const fakeWrongClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'client');

describe.only('Client Create API', () => {

	const clients = ['foo', 'bar'];

	const clientsToSave = clients.map(code => prepareFakeClient(code));

	const SecretHandler = class SecretHandler {
		getValue() {}
	};

	const stubGetSecret = (sandbox, value) => {

		CredentialsFetcher.secretValue = undefined;

		sandbox.stub(SecretHandler.prototype, 'getValue')
			.resolves(value || {});

		sandbox.stub(AwsSecretsManager, 'secret')
			.returns(new SecretHandler());
	};

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

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				stubGetSecret(sandbox);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();

				sandbox.spy(APICreate.prototype, 'postSaveHook');

			},
			after: (res, sandbox) => {

				sandbox.assert.calledOnceWithExactly(AwsSecretsManager.secret, janisServiceName);
				sandbox.assert.calledOnceWithExactly(SecretHandler.prototype.getValue);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);

				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients
				);

				mockRequire.stop(fakeClientPath);
			}
		},
		{
			description: 'Should save clients after fetching database credentials',
			request: {
				data: { clients }
			},
			response: { code: 200 },
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

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

				sandbox.assert.calledOnceWithExactly(AwsSecretsManager.secret, janisServiceName);
				sandbox.assert.calledOnceWithExactly(SecretHandler.prototype.getValue);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clients.map(code => prepareFakeClient(code, true)));

				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

				sandbox.assert.calledOnceWithExactly(
					APICreate.prototype.postSaveHook,
					clients
				);

				mockRequire.stop(fakeClientPath);
			}
		},
		{
			description: 'Should return 500 when the client model multiSave fails',
			request: {
				data: { clients }
			},
			response: { code: 500 },
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.rejects();

				sandbox.stub(Invoker, 'call')
					.resolves();
			},
			after: (res, sandbox) => {

				mockRequire.stop(fakeClientPath);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);
				sandbox.assert.notCalled(Invoker.call);
			}
		},
		{
			description: 'Should return 500 when invoking the index creator lambda fails',
			request: {
				data: { clients }
			},
			response: { code: 500 },
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves();

				sandbox.stub(Invoker, 'call')
					.rejects();
			},
			after: (res, sandbox) => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, clientsToSave);

				sandbox.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');
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
					clients: ['some-client', 'other-client']
				}
			},
			response: {
				code: 500
			},
			before: sandbox => {

				mockRequire(fakeWrongClientPath, ModelClient);

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				sandbox.stub(Invoker, 'call')
					.resolves();
			},
			after: (res, sandbox) => {

				sandbox.assert.notCalled(ModelClient.prototype.multiSave);
				sandbox.assert.notCalled(Invoker.call);
				mockRequire.stop(fakeClientPath);
			}
		}
	]);
});
