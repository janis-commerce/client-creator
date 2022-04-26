'use strict';

const logger = require('lllog')();

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');

const ModelFetcher = require('./helpers/model-fetcher');
const getClients = require('./helpers/get-clients');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientCode = this.eventId;

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio
		const model = new ClientModel();

		const client = ClientModel.validateAdditionalFields() ? await this.getClient(clientCode) : { code: clientCode };

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
		const client = await getClients([clientCode]);
		return client && client[0];
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
