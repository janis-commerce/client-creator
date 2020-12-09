'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const mockRequire = require('mock-require');
const path = require('path');

const { ListenerRemoved, ModelClient, ModelDefaultClient } = require('../lib');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const handler = (...args) => ServerlessHandler.handle(ListenerRemoved, ...args);

describe('Client Removed Listener', async () => {

	const client = {
		code: 'test1',
		databases: { default: [Object] },
		dateCreated: '2020-11-27T12:40:28.917Z',
		dateModified: '2020-11-27T19:23:25.624Z',
		status: 'active',
		id: '5fc0f3bc617a1b3e98009c4c'
	};

	const validEvent = {
		client: client.code,
		service: 'id',
		entity: 'client',
		event: 'removed'
	};

	await EventListenerTest(handler, [
		{
			description: 'Should return 400 when the event has no client',
			event: {
				...validEvent,
				client: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 500 when client model fails getting the client',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'getBy').rejects();

				sandbox.spy(ModelDefaultClient.prototype, 'dropDatabase');

				sandbox.spy(ModelClient.prototype, 'remove');

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.getBy, 'code', client.code);
				sandbox.assert.notCalled(ModelDefaultClient.prototype.dropDatabase);
				sandbox.assert.notCalled(ModelClient.prototype.remove);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when model default client fails to dropping the database',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(ModelDefaultClient.prototype, 'dropDatabase')
					.rejects();


			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.getBy, 'code', validEvent.client);
				sandbox.assert.calledOnceWithExactly(ModelDefaultClient.prototype.dropDatabase);
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when model default client fails removing the client',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(ModelDefaultClient.prototype, 'dropDatabase').resolves(true);

				sandbox.stub(ModelClient.prototype, 'remove').rejects();

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.getBy, 'code', client.code);
				sandbox.assert.calledOnceWithExactly(ModelDefaultClient.prototype.dropDatabase);
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.remove, { code: client.code });
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client was removed',
			event: validEvent,
			before: sandbox => {

				mockRequire(fakeClientPath, ModelClient);

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(ModelDefaultClient.prototype, 'dropDatabase').resolves(true);

				sandbox.stub(ModelClient.prototype, 'remove').resolves(true);

			},
			after: sandbox => {

				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.getBy, 'code', client.code);
				sandbox.assert.calledOnceWithExactly(ModelDefaultClient.prototype.dropDatabase);
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.remove, { code: client.code });
				mockRequire.stop(fakeClientPath);
			},
			responseCode: 200
		}
	]);
});
