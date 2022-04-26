'use strict';

require('lllog')('none');

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const MicroserviceCall = require('@janiscommerce/microservice-call');
const Settings = require('@janiscommerce/settings');

const { ServerlessHandler } = require('@janiscommerce/event-listener');

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

	const stubSettings = sandbox => {
		sandbox.stub(Settings, 'get')
			.returns(fakeDBSettings);
	};

	const fakeClient = prepareFakeClient(validEvent.id);

	const janisServiceName = 'some-service-name';
	process.env.JANIS_SERVICE_NAME = janisServiceName;

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
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.rejects();

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();
			},
			after: sandbox => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, fakeClient);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when the index creator fails',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves();

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.rejects();
			},
			after: sandbox => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, fakeClient);
				sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientCode);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client successfully',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, fakeClient);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when client model saves the new client successfully with additional fields',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 })
					.resolves({ statusCode: 200, body: [{ ...fakeClient, extraField: 'some-data', randomField: 'foobar' }] });

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				assertSecretsGet(sandbox, janisServiceName);

				const expectedClientToSave = { ...fakeClient, extraField: 'some-data' };

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 });
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, expectedClientToSave);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, expectedClientToSave);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when MicroserviceCall can\'t get the client from ID service',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 })
					.resolves({ statusCode: 400, body: {} });

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.spy(ModelClient.prototype, 'save');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(MongoDBIndexCreator.prototype, 'executeForClientCode');
				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 });
				sandbox.assert.notCalled(ModelClient.prototype.save);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				sandbox.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when MicroserviceCall don\'t any client from ID service',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 })
					.resolves({ statusCode: 200, body: [] });

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.spy(ModelClient.prototype, 'save');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(MongoDBIndexCreator.prototype, 'executeForClientCode');
				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 });
				sandbox.assert.notCalled(ModelClient.prototype.save);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				sandbox.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 500 when MicroserviceCall fails to get the client from ID service',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 })
					.resolves({ statusCode: 500, body: {} });

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.spy(ModelClient.prototype, 'save');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(MongoDBIndexCreator.prototype, 'executeForClientCode');
				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 });
				sandbox.assert.notCalled(ModelClient.prototype.save);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				sandbox.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when MicroserviceCall fails to get the client from ID service with API Error message',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				sandbox.stub(MicroserviceCall.prototype, 'safeList')
					.withArgs('id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 })
					.resolves({ statusCode: 500, body: { message: 'Some API Error' } });

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => ['extraField']);

				sandbox.spy(ModelClient.prototype, 'save');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(MongoDBIndexCreator.prototype, 'executeForClientCode');
				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeList, 'id', 'client', { filters: { clientCode: [validEvent.id] }, limit: 1 });
				sandbox.assert.notCalled(ModelClient.prototype.save);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				sandbox.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when additional fields getter is invalid',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient, 'additionalFields')
					.get(() => 'not an array');

				stubSettings(sandbox);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.spy(MicroserviceCall.prototype, 'safeList');
				sandbox.spy(ModelClient.prototype, 'save');
				sandbox.spy(MongoDBIndexCreator.prototype, 'executeForClientCode');
				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				sandbox.assert.notCalled(MicroserviceCall.prototype.safeList);
				sandbox.assert.notCalled(ModelClient.prototype.save);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				sandbox.assert.notCalled(ListenerCreated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client successfully after fetching credentials',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				stubSettings(sandbox);

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

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();
			},
			after: sandbox => {

				assertSecretsGet(sandbox, janisServiceName);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id, true));
				stopMock();

			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when client model saves the new client successfully without credentials after Secrets Manager throws',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				stubSettings(sandbox);

				setEnv();

				secretThrows(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, fakeClient);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 when client model saves the new client successfully without credentials after Secrets Manager getValue rejects',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				stubSettings(sandbox);

				setEnv();

				getValueRejects(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, fakeClient);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, fakeClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 and save the client when no settings found',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				sandbox.stub(Settings, 'get')
					.returns();

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				const expectedSavedClient = prepareFakeClient(validEvent.id, false, false);

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, expectedSavedClient);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, expectedSavedClient);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 200 and save the client when no need to fetch credentials',
			event: validEvent,
			before: sandbox => {

				delete ClientFormatter.settings;

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				const { secureDB, ...noSecureSettings } = fakeDBSettings;

				sandbox.stub(Settings, 'get')
					.returns(noSecureSettings);

				setEnv();

				stubGetSecret(sandbox);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				secretsNotCalled(sandbox);

				const preparedClient = prepareFakeClient(validEvent.id);
				delete preparedClient.databases.secureDB;

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, preparedClient);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, preparedClient);

				stopMock();

			},
			responseCode: 200
		}
	]);
});
