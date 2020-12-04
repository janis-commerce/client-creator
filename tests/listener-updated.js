'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MicroserviceCall = require('@janiscommerce/microservice-call');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const mockRequire = require('mock-require');
const path = require('path');

const { ListenerUpdated, ModelClient } = require('../lib');

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

				sandbox.stub(ModelClient.prototype, 'update')
					.rejects();

				sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { code: client.code });
				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);
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

				sandbox.spy(ModelClient.prototype, 'update');

				sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				sandbox.assert.notCalled(ModelClient.prototype.update);
				sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);
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

				sandbox.stub(ModelClient.prototype, 'update')
					.resolves(true);

				sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { code: client.code });
				sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', validEvent.id);
				sandbox.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, validEvent.id);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		}
	]);
});
