'use strict';

const logger = require('lllog')();

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const ModelFetcher = require('./helpers/model-fetcher');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientCode = this.eventId;

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio
		const model = new ClientModel();

		const client = await this.getClient(clientCode);

		if(!client) {
			logger.error('Unable to get Janis ID client, it won\'t be created.');
			return;
		}

		const [formattedClient] = await ClientModel.formatForCreate([client]);

		await model.save(formattedClient);

		await mongoDBIndexCreator.executeForClientCode(clientCode);

		return this.postSaveHook(clientCode, formattedClient);
	}

	async getClient(clientCode) {

		const msCall = new MicroserviceCall();

		const { statusCode, body } = await msCall.safeList('id', 'client', { filters: { clientCode }, limit: 1 });

		if(statusCode >= 500) {
			const errorMessage = body && body.message ? `${body.message}` : 'Service failed';
			throw new Error(`Failed to get Janis ID client: ${errorMessage}`);
		}

		return statusCode < 400 && body[0];
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
