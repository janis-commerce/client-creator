'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');

const ModelFetcher = require('./helpers/model-fetcher');
const ModelClient = require('./model-client');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientCode = this.eventId;

		const formattedClient = await ModelClient.formatForCreate(clientCode);

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio

		const model = new ClientModel();

		await model.save(formattedClient);

		await mongoDBIndexCreator.executeForClientCode(clientCode);

		return this.postSaveHook(clientCode);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
