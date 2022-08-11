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

	const assertClientGet = sinon => {
		sinon.assert.calledOnceWithExactly(ModelClient.prototype.get, { filters: { code: [client.code] } });
	};

	await EventListenerTest(ClientRemoved, [
		{
			description: 'Should return 400 when the event has no id with clientCode',
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		}, {
			description: 'Should return 404 when client model could not found the client',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'get').resolves([]);

				sinon.spy(Model.prototype, 'dropDatabase');

				sinon.spy(ModelClient.prototype, 'multiRemove');

				sinon.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sinon => {
				assertClientGet(sinon);
				sinon.assert.notCalled(Model.prototype.dropDatabase);
				sinon.assert.notCalled(ModelClient.prototype.multiRemove);
				sinon.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 404
		}, {
			description: 'Should return 500 when client model fails getting the client',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'get').rejects();

				sinon.spy(Model.prototype, 'dropDatabase');

				sinon.spy(ModelClient.prototype, 'multiRemove');

				sinon.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sinon => {
				assertClientGet(sinon);
				sinon.assert.notCalled(Model.prototype.dropDatabase);
				sinon.assert.notCalled(ModelClient.prototype.multiRemove);
				sinon.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		}, {
			description: 'Should return 500 when model default client fails to drop the database',
			event: validEvent,
			before: sinon => {


				mockModelClient();

				sinon.stub(ModelClient.prototype, 'get').resolves([client]);

				sinon.stub(Model.prototype, 'dropDatabase').rejects();

				sinon.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sinon => {
				assertClientGet(sinon);
				sinon.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sinon.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		}, {
			description: 'Should return 500 when model default client fails removing the client',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'get').resolves([client]);

				sinon.stub(Model.prototype, 'dropDatabase').resolves(true);

				sinon.stub(ModelClient.prototype, 'multiRemove').rejects();

				sinon.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sinon => {
				assertClientGet(sinon);
				sinon.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiRemove, { code: [client.code] });
				sinon.assert.notCalled(ListenerRemoved.prototype.postRemovedHook);

				stopMock();
			},
			responseCode: 500
		}, {
			description: 'Should return 200 when client was removed',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				sinon.stub(ModelClient.prototype, 'get').resolves([client]);

				sinon.stub(Model.prototype, 'dropDatabase').resolves(true);

				sinon.stub(ModelClient.prototype, 'multiRemove').resolves(true);

				sinon.spy(ListenerRemoved.prototype, 'postRemovedHook');
			},
			after: sinon => {
				assertClientGet(sinon);
				sinon.assert.calledOnceWithExactly(Model.prototype.dropDatabase);
				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiRemove, { code: [client.code] });
				sinon.assert.calledOnceWithExactly(ListenerRemoved.prototype.postRemovedHook, client.code);

				stopMock();
			},
			responseCode: 200
		}
	]);
});
