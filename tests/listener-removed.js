'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const Model = require('@janiscommerce/model');

const { ListenerRemoved, ModelClient } = require('../lib');

const {
	mockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

const ClientRemoved = (...args) => ServerlessHandler.handle(ListenerRemoved, ...args);

describe('Client Removed Listener', async () => {

	const client = {
		code: 'test1',
		databases: {
			default: {
				write: {
					type: 'mongodb',
					protocol: 'mongodb+srv://',
					user: 'user',
					password: 'some-password',
					host: 'somehost.mongodb.net/test?retryWrites=true&w=majority',
					database: 'janis-fizzmodarg'
				}
			}
		},
		dateCreated: '2020-11-27T12:40:28.917Z',
		dateModified: '2020-11-27T19:23:25.624Z',
		status: 'active',
		id: '5fc0f3bc617a1b3e98009c4c'
	};

	const validEvent = {
		service: 'id',
		entity: 'client',
		event: 'removed',
		id: client.code
	};

	const sandboxAssertGetBy = sandbox => {
		sandbox.assert.calledOnceWithExactly(ModelClient.prototype.getBy, 'code', client.code, { unique: true });
	};

	await EventListenerTest(ClientRemoved, [
		{
			description: 'Should return 400 when the event has no id with clientCode',
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 404 when client model could not found the client',
			event: validEvent,
			before: sandbox => {

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'getBy').resolves(null);

				sandbox.spy(Model.prototype, 'dropDatabase');

				sandbox.spy(ModelClient.prototype, 'remove');

				sandbox.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sandbox => {
				sandboxAssertGetBy(sandbox);
				sandbox.assert.notCalled(Model.prototype.dropDatabase);
				sandbox.assert.notCalled(ModelClient.prototype.remove);
				sandbox.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 404
		},
		{
			description: 'Should return 500 when client model fails getting the client',
			event: validEvent,
			before: sandbox => {

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'getBy').rejects();

				sandbox.spy(Model.prototype, 'dropDatabase');

				sandbox.spy(ModelClient.prototype, 'remove');

				sandbox.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sandbox => {
				sandboxAssertGetBy(sandbox);
				sandbox.assert.notCalled(Model.prototype.dropDatabase);
				sandbox.assert.notCalled(ModelClient.prototype.remove);
				sandbox.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when model default client fails to drop the database',
			event: validEvent,
			before: sandbox => {


				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(Model.prototype, 'dropDatabase').rejects();

				sandbox.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sandbox => {
				sandboxAssertGetBy(sandbox);
				sandbox.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sandbox.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		},
		{
			description: 'Should return 500 when model default client fails removing the client',
			event: validEvent,
			before: sandbox => {

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(Model.prototype, 'dropDatabase').resolves(true);

				sandbox.stub(ModelClient.prototype, 'remove').rejects();

				sandbox.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sandbox => {
				sandboxAssertGetBy(sandbox);
				sandbox.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.remove, { code: client.code });
				sandbox.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		},
		{
			description: 'Should return 200 when client was removed',
			event: validEvent,
			before: sandbox => {

				mockModelClient();

				sandbox.stub(ModelClient.prototype, 'getBy').resolves([client]);

				sandbox.stub(Model.prototype, 'dropDatabase').resolves(true);

				sandbox.stub(ModelClient.prototype, 'remove').resolves(true);

				sandbox.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sandbox => {
				sandboxAssertGetBy(sandbox);
				sandbox.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sandbox.assert.calledOnceWithExactly(ModelClient.prototype.remove, { code: client.code });
				sandbox.assert.calledOnceWithExactly(ListenerRemoved.prototype.postRemovedHook, client.code);

				stopMock();
			},
			responseCode: 200
		}
	]);
});
