'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');

const ClientModel = require('./helpers/client-model-fetcher');
const ModelFormatter = require('./helpers/model-formatter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientCode = this.eventId;

		await this.saveClient(clientCode);

		await mongoDBIndexCreator.executeForClientCode(clientCode);

		return this.postSaveHook(clientCode);
	}

	async saveClient(clientCode) {

		await ModelFormatter.prepareSettings();

		const model = new ClientModel();

		return model.save(ModelFormatter.format(clientCode));
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
