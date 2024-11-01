'use strict';

require('lllog')('none');

const EventListenerTest = require('@janiscommerce/event-listener-test');

const { ServerlessHandler } = require('@janiscommerce/event-listener');

const { Invoker } = require('@janiscommerce/lambda');

const { ListenerCreated, ModelClient } = require('../lib');

const ClientFormatter = require('../lib/helpers/client-formatter');

const {
	mockModelClient,
	stopMock
} = require('./helpers/model-fetcher');

const { setJanisServiceName, restoreEnvs } = require('./helpers/utils');

const { stubParameterResolves, resetSSMMock } = require('./helpers/parameter-store');

const ClientCreated = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);

describe('Client Created Listener', async () => {

	const validEvent = {
		id: 'client-code',
		service: 'id',
		entity: 'client',
		event: 'created'
	};

	const client = {
		code: validEvent.id,
		status: ModelClient.statuses.active
	};

	const serviceName = 'service-name';

	const databaseId1 = '6724c02bf89103b7316b2da7';

	const getIDClientsResolves = (sinon, clients = [], statusCode = 200) => {
		sinon.stub(Invoker, 'serviceCall')
			.resolves(({ statusCode, payload: { items: clients } }));
	};

	const assertGetIDClients = sinon => {
		sinon.assert.calledOnceWithExactly(Invoker.serviceCall, 'id', 'GetClient', {
			filters: { code: [validEvent.id] },
			limit: 1
		});
	};

	const stubMongoDBIndexCreator = sinon => {
		sinon.stub(Invoker, 'call').withArgs('MongoDBIndexCreator')
			.resolves();
	};

	const assertMongoDBIndexCreator = sinon => sinon.assert.calledOnceWithExactly(Invoker.call, 'MongoDBIndexCreator');

	const commonBeforeEach = () => {
		setJanisServiceName(serviceName);
	};

	const commonAfterEach = sinon => {
		restoreEnvs();
		stopMock();
		ClientFormatter.restore();
		assertGetIDClients(sinon);
		resetSSMMock();
	};

	await EventListenerTest(ClientCreated, [
		{
			description: 'Should return 400 when the event has no ID',
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 200 when client model saves the new client successfully',
			event: validEvent,
			before: sinon => {

				commonBeforeEach(sinon);

				mockModelClient();

				stubParameterResolves({
					newClientsDatabases: { default: databaseId1 }
				});

				getIDClientsResolves(sinon, [client]);

				sinon.stub(ModelClient.prototype, 'get')
					.resolves([]);

				sinon.stub(ModelClient.prototype, 'multiSave')
					.resolves(true);

				stubMongoDBIndexCreator(sinon);

				sinon.spy(ListenerCreated.prototype, 'postSaveHook');
			},
			after: sinon => {

				const clientToSave = {
					...client,
					db: {
						default: {
							id: databaseId1,
							database: `${serviceName}-${client.code}`
						}
					}
				};

				sinon.assert.calledOnceWithExactly(ModelClient.prototype.multiSave, [clientToSave]);

				assertMongoDBIndexCreator(sinon);

				sinon.assert.calledOnceWithExactly(ListenerCreated.prototype.postSaveHook, validEvent.id, clientToSave);

				commonAfterEach(sinon);
			},
			responseCode: 200
		}
	]);
});
