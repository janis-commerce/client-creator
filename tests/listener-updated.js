'use strict';

require('lllog')('none');

const EventListenerTest = require('@janiscommerce/event-listener-test');

const { ServerlessHandler } = require('@janiscommerce/event-listener');

const { Invoker } = require('@janiscommerce/lambda');

const { ListenerUpdated, ModelClient } = require('../lib');

const {
	mockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

const ClientUpdated = (...args) => ServerlessHandler.handle(ListenerUpdated, ...args);

describe('Client Updated Listener', async () => {

	const validEvent = {
		id: '5fc0f3bc617a1b3e98009c4c',
		service: 'id',
		entity: 'client',
		event: 'updated'
	};

	const client = {
		id: '5fc0f3bc617a1b3e98009c4c',
		code: 'the-client',
		status: ModelClient.statuses.active
	};

	const getIDClientsResolves = (sinon, clients = [], statusCode = 200) => {
		sinon.stub(Invoker, 'serviceCall')
			.resolves(({ statusCode, payload: { items: clients } }));
	};

	const assertGetIDClients = sinon => {
		sinon.assert.calledOnceWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { id: [validEvent.id] },
			limit: 1
		});
	};

	const assertSaveClient = (sinon, clientToSave) => {
		sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [clientToSave]);
	};

	const getCurrentClientsResolves = (sinon, currentClients = []) => {
		sinon.stub(ModelClient.prototype, 'get')
			.resolves(currentClients);
	};

	await EventListenerTest(ClientUpdated, [
		{
			description: 'Should return 200 when client model updates the client status',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				getIDClientsResolves(sinon, [client]);

				getCurrentClientsResolves(sinon, [{
					...client,
					status: ModelClient.statuses.inactive
				}]);

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves();

				sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
			},
			after: sinon => {

				assertGetIDClients(sinon);

				assertSaveClient(sinon, {
					code: client.code,
					status: client.status
				});

				sinon.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, client);

				stopMock();

			},
			responseCode: 200
		}, {
			description: 'Should return 500 and return when ID returns 400',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				getIDClientsResolves(sinon, null, 400);

				sinon.spy(ModelClient.prototype, 'update');
				sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
			},
			after: sinon => {

				assertGetIDClients(sinon);

				sinon.assert.notCalled(ModelClient.prototype.update);
				sinon.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		}, {
			description: 'Should return 500 and return when could not find the client',
			event: validEvent,
			before: sinon => {

				mockModelClient();

				getIDClientsResolves(sinon, []);

				sinon.spy(ModelClient.prototype, 'update');
				sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
			},
			after: sinon => {

				assertGetIDClients(sinon);

				sinon.assert.notCalled(ModelClient.prototype.update);
				sinon.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

				stopMock();

			},
			responseCode: 500
		}, {
			description: 'Should return 400 when the event has no ID',
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		}
	]);
});
