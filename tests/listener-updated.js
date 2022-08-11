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
		id: '62f5406ccb61cc1aaa8aeb39',
		service: 'id',
		entity: 'client',
		event: 'updated'
	};

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
		status: 'inactive',
		id: '5fc0f3bc617a1b3e98009c4c'
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
		sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [{
			code: client.code,
			...clientToSave
		}]);
	};

	describe('Errors', async () => {

		await EventListenerTest(ClientUpdated, [
			{
				description: 'Should return 400 when the event has no ID',
				event: {
					...validEvent,
					id: undefined
				},
				responseCode: 400
			}, {
				description: 'Should return 500 when client model fails updating the status',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					getIDClientsResolves(sinon, [client]);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.rejects();

					sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sinon => {

					assertGetIDClients(sinon);

					assertSaveClient(sinon, { status: client.status });

					sinon.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 500
			}, {
				description: 'Should return 500 and throw error when fails to getting the client',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					getIDClientsResolves(sinon, null, 500);

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
				description: 'Should return 500 when client model additional fields getter is invalid',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					sinon.stub(ModelClient, 'additionalFields')
						.get(() => 'not an array');

					getIDClientsResolves(sinon, [client]);

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
			}
		]);
	});

	describe('200 response', async () => {

		await EventListenerTest(ClientUpdated, [
			{
				description: 'Should return 200 and return when ID returns 400',
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
				responseCode: 200
			}, {
				description: 'Should return 200 and return when could not find the client',
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
				responseCode: 200
			}, {
				description: 'Should return 200 when client model updates the client status',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					getIDClientsResolves(sinon, [client]);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves();

					sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sinon => {

					assertGetIDClients(sinon);

					assertSaveClient(sinon, { status: client.status });

					sinon.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, client);

					stopMock();

				},
				responseCode: 200
			}, {
				description: 'Should return 200 when client model updates the client status using additional fields',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					sinon.stub(ModelClient, 'additionalFields')
						.get(() => ['extraField', 'anotherExtraField']);

					getIDClientsResolves(sinon, [{
						...client,
						extraField: 'some-data',
						anotherExtraField: 0,
						randomField: 'other-data'
					}]);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves();

					sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sinon => {

					assertGetIDClients(sinon);

					const clientFieldsToUpdate = { extraField: 'some-data', anotherExtraField: 0 };

					assertSaveClient(sinon, { ...clientFieldsToUpdate, status: client.status });

					sinon.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, { ...client, ...clientFieldsToUpdate, randomField: 'other-data' });

					stopMock();

				},
				responseCode: 200
			}, {
				description: 'Should return 200 and unset the additional fields that were removed in ID service',
				event: validEvent,
				before: sinon => {

					mockModelClient();

					sinon.stub(ModelClient, 'additionalFields')
						.get(() => ['extraField']);

					getIDClientsResolves(sinon, [{ ...client, randomField: 'other-data' }]);

					sinon.stub(ModelClient.prototype, 'multiSave')
						.resolves();

					sinon.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sinon => {

					assertGetIDClients(sinon);

					assertSaveClient(sinon, { status: client.status, $unset: { extraField: '' } });

					sinon.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, { ...client, randomField: 'other-data' });

					stopMock();

				},
				responseCode: 200
			}
		]);
	});
});
