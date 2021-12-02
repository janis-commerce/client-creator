'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id));
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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id));
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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id));
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id);

				stopMock();

			},
			responseCode: 200
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
		}, {
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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id));
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id);

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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id));
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id);

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

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareFakeClient(validEvent.id, false, false));
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id);

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
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id);

				stopMock();

			},
			responseCode: 200
		}
	]);
});
