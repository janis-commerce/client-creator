'use strict';

require('lllog')('none');

const EventListenerTest = require('@janiscommerce/event-listener-test');

const { ServerlessHandler } = require('@janiscommerce/event-listener');

const { Invoker } = require('@janiscommerce/lambda');

const Settings = require('@janiscommerce/settings');

const { ListenerCreated, ModelClient } = require('../lib');

const ClientFormatter = require('../lib/helpers/client-formatter');

const fakeDBSettings = require('./helpers/fake-db-settings.json');
const prepareFakeClient = require('./helpers/prepare-fake-client');

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
	stopMock
} = require('./helpers/model-fetcher');

const ClientCreated = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);

describe('Client Created Listener', async () => {

	const validEvent = {
		id: 'client-code',
		service: 'id',
		entity: 'client',
		event: 'created'
	};

	const stubSettings = sinon => {
		sinon.stub(Settings, 'get')
			.returns(fakeDBSettings);
	};

	const fakeClient = prepareFakeClient(validEvent.id);

	const janisServiceName = 'some-service-name';
	process.env.JANIS_SERVICE_NAME = janisServiceName;

	const getIDClientsResolves = (sinon, clients = [], statusCode = 200) => {
		sinon.stub(Invoker, 'serviceCall')
			.resolves(({ statusCode, payload: { items: clients } }));
	};

	const assertGetIDClients = sinon => {
		sinon.assert.calledOnceWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { code: [validEvent.id] },
			limit: 1
		});
	};

	const assertInvokeIndexCreator = sinon => sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

	await EventListenerTest(ClientCreated, [
		{
			description: 'Should return 400 when the event has no ID',
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 500 when client model fails to save the new client',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.rejects();

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();
			},
			after: sinon => {

				assertSecretsGet(sinon, janisServiceName);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [fakeClient]);
				sinon.assert.notCalled(Invoker.call);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when the index creator fails',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves();

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.rejects();
			},
			after: sinon => {

				assertSecretsGet(sinon, janisServiceName);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [fakeClient]);
				sinon.assert.calledOnce(Invoker.call);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client successfully',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				assertSecretsGet(sinon, janisServiceName);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [fakeClient]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when client model saves the new client successfully with additional fields',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				getIDClientsResolves(sinon, [{ ...fakeClient, extraField: 'some-data', randomField: 'foobar' }]);

				mockModelClient();

				sinon.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				assertSecretsGet(sinon, janisServiceName);

				const expectedClientToSave = { ...fakeClient, extraField: 'some-data' };

				assertGetIDClients(sinon);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [expectedClientToSave]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, expectedClientToSave);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when can\'t get the client from ID service',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				getIDClientsResolves(sinon, [], 400);

				mockModelClient();

				sinon.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sinon.spy(ModelClient.prototype, 'multiSave');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.spy(Invoker, 'call');
				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				assertGetIDClients(sinon);

				sinon.assert.notCalled(ModelClient.prototype.multiSave);
				sinon.assert.notCalled(Invoker.call);
				sinon.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when not found any client from ID service',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				getIDClientsResolves(sinon, []);

				mockModelClient();

				sinon.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sinon.spy(ModelClient.prototype, 'multiSave');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.spy(Invoker, 'call');
				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				assertGetIDClients(sinon);

				sinon.assert.notCalled(ModelClient.prototype.multiSave);
				sinon.assert.notCalled(Invoker.call);
				sinon.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 500 when fails to get the client from ID service',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				getIDClientsResolves(sinon, null, 500);

				mockModelClient();

				sinon.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sinon.spy(ModelClient.prototype, 'multiSave');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.spy(Invoker, 'call');
				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				assertGetIDClients(sinon);

				sinon.assert.notCalled(ModelClient.prototype.multiSave);
				sinon.assert.notCalled(Invoker.call);
				sinon.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when additional fields getter is invalid',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient, 'additionalFields')
					.get(() => 'not an array');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon);

				sinon.spy(Invoker, 'serviceCall');

				sinon.spy(ModelClient.prototype, 'multiSave');
				sinon.spy(Invoker, 'call');
				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				sinon.assert.notCalled(Invoker.serviceCall);
				sinon.assert.notCalled(ModelClient.prototype.multiSave);
				sinon.assert.notCalled(Invoker.call);
				sinon.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client successfully after fetching credentials',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				stubSettings(sinon);

				setEnv();

				stubGetSecret(sinon, {
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

				sinon.stub(Invoker, 'call')
					.resolves();
			},
			after: sinon => {

				assertSecretsGet(sinon, janisServiceName);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [prepareFakeClient(validEvent.id, true)]);
				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when client model saves the new client successfully without credentials after Secrets Manager throws',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				stubSettings(sinon);

				setEnv();

				secretThrows(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [fakeClient]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 when client model saves the new client successfully without credentials after Secrets Manager getValue rejects',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				stubSettings(sinon);

				setEnv();

				getValueRejects(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [fakeClient]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 and save the client when no settings found',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				sinon.stub(Settings, 'get')
					.returns();

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				const expectedSavedClient = prepareFakeClient(validEvent.id, false, false);

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [expectedSavedClient]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, expectedSavedClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 and save the client when no need to fetch credentials',
			event: validEvent,
			before: sinon => {

				delete ClientFormatter.settings;

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves('');

				const { secureDB, ...noSecureSettings } = fakeDBSettings;

				sinon.stub(Settings, 'get')
					.returns(noSecureSettings);

				setEnv();

				stubGetSecret(sinon);

				sinon.stub(Invoker, 'call')
					.resolves();

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				secretsNotCalled(sinon);

				const preparedClient = prepareFakeClient(validEvent.id);
				delete preparedClient.databases.secureDB;

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [preparedClient]);

				assertInvokeIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, preparedClient);

				stopMock();

			},
			responseCode: 200
		}
	]);
});
