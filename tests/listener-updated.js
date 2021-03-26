'use strict';

const EventListenerTest = require('@janiscommerce/event-listener-test');
const MicroserviceCall = require('@janiscommerce/microservice-call');
const { ServerlessHandler } = require('@janiscommerce/event-listener');

const { ListenerUpdated, ModelClient } = require('../lib');

const {
	mockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

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

	const msCall200 = { statusCode: 200, body: client };

	const id = { id: validEvent.id };
	describe('Errors', async () => {
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

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall').resolves(msCall200);

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(false);

					sandbox.stub(ModelClient.prototype, 'update').rejects();

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { code: client.code });
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, msCall200);
					sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 500
			},
			{
				description: 'Should return 500 and throw custom error when msCall fails to getting the client',
				event: validEvent,
				before: sandbox => {

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall')
						.resolves({ statusCode: 500, body: { message: 'Internal server error' } });

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(true);

					sandbox.spy(ModelClient.prototype, 'update');

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, { statusCode: 500, body: { message: 'Internal server error' } });
					sandbox.assert.notCalled(ModelClient.prototype.update);
					sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 500
			},
			{
				description: 'Should return 500 and throw generic error when msCall fails to getting the client',
				event: validEvent,
				before: sandbox => {

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall')
						.resolves({ statusCode: 500, body: { } });

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(true);

					sandbox.spy(ModelClient.prototype, 'update');

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, { statusCode: 500, body: { } });
					sandbox.assert.notCalled(ModelClient.prototype.update);
					sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 500
			}
		]);
	});

	describe('200 response', async () => {
		await EventListenerTest(handler, [
			{
				description: 'Should return 200 and return when msCall gets 400 error',
				event: validEvent,
				before: sandbox => {

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall')
						.resolves({ statusCode: 400, body: {} });

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(false);

					sandbox.spy(ModelClient.prototype, 'update');

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, { statusCode: 400, body: {} });
					sandbox.assert.notCalled(ModelClient.prototype.update);
					sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 200
			},
			{
				description: 'Should return 200 and return when msCall could not find the client',
				event: validEvent,
				before: sandbox => {

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall')
						.resolves({ statusCode: 404, body: { message: 'Internal server error' } });

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(false);

					sandbox.spy(ModelClient.prototype, 'update');

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, { statusCode: 404, body: { message: 'Internal server error' } });
					sandbox.assert.notCalled(ModelClient.prototype.update);
					sandbox.assert.notCalled(ListenerUpdated.prototype.postSaveHook);

					stopMock();

				},
				responseCode: 200
			},
			{
				description: 'Should return 200 when client model updates the client status',
				event: validEvent,
				before: sandbox => {

					mockModelClient();

					sandbox.stub(MicroserviceCall.prototype, 'safeCall')
						.resolves(msCall200);

					sandbox.stub(MicroserviceCall.prototype, 'shouldRetry').returns(false);

					sandbox.stub(ModelClient.prototype, 'update')
						.resolves(true);

					sandbox.spy(ListenerUpdated.prototype, 'postSaveHook');
				},
				after: sandbox => {
					sandbox.assert.calledOnceWithExactly(ModelClient.prototype.update, { status: client.status }, { code: client.code });
					sandbox.assert.calledOnceWithExactly(
						MicroserviceCall.prototype.safeCall, 'id', 'client', 'get', null, null, id
					);
					sandbox.assert.calledOnceWithExactly(MicroserviceCall.prototype.shouldRetry, msCall200);
					sandbox.assert.calledOnceWithExactly(ListenerUpdated.prototype.postSaveHook, client);

					stopMock();

				},
				responseCode: 200
			}
		]);
	});
});
