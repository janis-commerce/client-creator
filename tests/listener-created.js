'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const Settings = require('@janiscommerce/settings');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const mockRequire = require('mock-require');
const path = require('path');
const ClientCreatedListener = require('../lib/listener-created');
const ClientModel = require('../lib/model-client');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const handler = (...args) => ServerlessHandler.handle(ClientCreatedListener, ...args);

describe('Client Created Listener', async () => {

	const validEvent = {
		id: 'some-client',
		service: 'id',
		entity: 'client',
		event: 'created'
	};

	const fakeSettings = {
		newClients: {
			host: 'some-database-host'
		}
	};

	const fakeFullSettings = {
		newClients: {
			host: 'some-database-host',
			protocol: 'some-protocol://',
			port: 27017,
			user: 'some-user',
			password: 'some-password'
		}
	};

	const expectedClientObject = {
		code: 'some-client',
		status: ClientModel.statuses.active,
		dbHost: fakeSettings.newClients.host,
		dbDatabase: 'janis-some-client'
	};

	const expectedFullClientObject = {
		...expectedClientObject,
		dbProtocol: fakeFullSettings.newClients.protocol,
		dbPort: fakeFullSettings.newClients.port,
		dbUser: fakeFullSettings.newClients.user,
		dbPassword: fakeFullSettings.newClients.password
	};

	await EventListenerTest(handler, [

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
			session: true,
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);
				sandbox.stub(ClientModel.prototype, 'save').throws();
				sandbox.stub(Settings, 'get').returns(fakeSettings);
				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode').resolves();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.save, expectedClientObject);
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when the index creator fails',
			event: validEvent,
			session: true,
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);
				sandbox.stub(ClientModel.prototype, 'save').resolves();
				sandbox.stub(Settings, 'get').returns(fakeSettings);
				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode').throws();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.save, expectedClientObject);
				sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientCode);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client sucessfully',
			event: validEvent,
			session: true,
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);
				sandbox.stub(ClientModel.prototype, 'save').resolves('5dea9fc691240d00084083f9');
				sandbox.stub(Settings, 'get').returns(fakeSettings);
				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode').resolves();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.save, expectedClientObject);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, 'some-client');
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		},
		{
			description: 'Should return 200 when client model saves the new client with full database config sucessfully',
			event: validEvent,
			session: true,
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);
				sandbox.stub(ClientModel.prototype, 'save').resolves('5dea9fc691240d00084083f9');
				sandbox.stub(Settings, 'get').returns(fakeFullSettings);
				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode').resolves();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.save, expectedFullClientObject);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, 'some-client');
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		}
	]);
});
