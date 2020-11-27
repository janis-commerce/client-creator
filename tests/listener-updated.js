'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const Settings = require('@janiscommerce/settings');
const MicroserviceCall = require('@janiscommerce/microservice-call');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const mockRequire = require('mock-require');
const path = require('path');

const { ListenerUpdated, ModelClient } = require('../lib');

const fakeDBSettings = require('./fake-db-settings');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const handler = (...args) => ServerlessHandler.handle(ListenerUpdated, ...args);

describe('Client Updated Listener', async () => {

	const validEvent = {
		id: 'some-client',
		service: 'id',
		entity: 'client',
		event: 'updated'
	};

	const client = {
		code: 'test1',
		databases: { default: [Object] },
		dateCreated: '2020-11-27T12:40:28.917Z',
		dateModified: '2020-11-27T19:23:25.624Z',
		status: 'inactive',
		id: '5fc0f3bc617a1b3e98009c4c'
	};

	const stubSettings = sandbox => {
		sandbox.stub(Settings, 'get')
			.returns(fakeDBSettings);
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
			description: 'Should return 500 when client model fails updating the status',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(MicroserviceCall.prototype, 'safeCall')
					.resolves({ body: client });

				stubSettings(sandbox);

				sandbox.stub(ModelClient.prototype, 'update')
					.rejects();

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { id: 'some-client' });
				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when msCall fails to getting the client',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(MicroserviceCall.prototype, 'safeCall')
					.rejects();

				stubSettings(sandbox);

				sandbox.stub(ModelClient.prototype, 'update');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				sandbox.assert.notCalled(ModelClient.prototype.update);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client model updates the client status',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(MicroserviceCall.prototype, 'safeCall')
					.resolves({ body: client });

				stubSettings(sandbox);

				sandbox.stub(ModelClient.prototype, 'update')
					.resolves(true);

				sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { id: 'some-client' });
				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				sandbox.assert.calledOnce(ListenerUpdated.prototype.postSaveHook);
				// sandbox.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, 'some-client');
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200,
			responseBody: true
		}
	]);
});
