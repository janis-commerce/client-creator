'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const Settings = require('@janiscommerce/settings');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const mockRequire = require('mock-require');
const path = require('path');

const { ListenerCreated, ModelClient } = require('../lib');

const fakeDBSettings = require('./fake-db-settings');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const handler = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);

describe('Client Created Listener', async () => {

	const validEvent = {
		id: 'some-client',
		service: 'id',
		entity: 'client',
		event: 'created'
	};

	const prepareClient = code => ({
		code,
		databases: {
			default: {
				write: {
					host: 'database-host',
					database: `janis-${code}`,
					someLimit: 10
				}
			},
			onlyWriteDB: {
				write: {
					host: 'write-database-host',
					database: `janis-write-${code}`
				}
			},
			completeDB: {
				write: {
					host: 'complete-write-database-host',
					database: `janis-complete-write-${code}`
				},
				read: {
					host: 'complete-read-database-host',
					database: `janis-complete-read-${code}`
				}
			}
		},
		status: ModelClient.statuses.active
	});

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

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'save')
					.rejects();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareClient('some-client'));
				sandbox.assert.notCalled(MongoDBIndexCreator.prototype.executeForClientCode);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when the index creator fails',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves();

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.rejects();
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareClient('some-client'));
				sandbox.assert.calledOnce(MongoDBIndexCreator.prototype.executeForClientCode);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model saves the new client sucessfully',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'save')
					.resolves('5dea9fc691240d00084083f9');

				sandbox.stub(Settings, 'get').returns(fakeDBSettings);

				sandbox.stub(MongoDBIndexCreator.prototype, 'executeForClientCode')
					.resolves();

				sandbox.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.save, prepareClient('some-client'));
				sandbox.assert.calledOnceWithExactly(MongoDBIndexCreator.prototype.executeForClientCode, 'some-client');
				sandbox.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, 'some-client');
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		}
	]);
});
