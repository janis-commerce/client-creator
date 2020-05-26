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

		database: {

			core: {
				host: 'core-database-host',
				protocol: 'core-protocol://',
				port: 27017,
				user: 'core-user',
				password: 'core-password'
			},
			newClients: {
				host: 'some-database-host',
				protocol: 'some-protocol://',
				port: 27017,
				user: 'some-user',
				password: 'some-password'
			}
		},
		clients: {
			newClientsDatabaseKey: 'newClients'
		}
	};

	const expectedClientObject = {
		code: 'some-client',
		status: ClientModel.statuses.active,
		...fakeSettings.database.newClients,
		dbDatabase: 'janis-some-client'
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
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'save')
					.rejects();

				sandbox.stub(Settings, 'get')
					.callsFake(setting => fakeSettings[setting]);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();
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
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'save')
					.resolves();

				sandbox.stub(Settings, 'get')
					.callsFake(setting => fakeSettings[setting]);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.rejects();
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
			before: sandbox => {

				mockRequire(fakeClientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				sandbox.stub(Settings, 'get')
					.callsFake(setting => fakeSettings[setting]);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ClientCreatedListener.prototype, 'postSaveHook');
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.save, expectedClientObject);
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, 'some-client');
				sandbox.assert.calledOnceWithExactly(ClientCreatedListener.prototype.postSaveHook, 'some-client', fakeSettings.database.newClients);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		}
	]);
});
