'use strict';

const { API } = require('@janiscommerce/api');

const { Invoker } = require('@janiscommerce/lambda');

const ClientFetcher = require('./helpers/model-fetcher');
const ModelFormatter = require('./helpers/model-formatter');

module.exports = class ClientCreateAPI extends API {

	async validate(data = this.data) {

		if(data === null || typeof data !== 'object' || Array.isArray(data))
			throw new Error('Invalid data: Should be an object, also not an array.');

		if(!Array.isArray(data.clients))
			throw new Error('Invalid data: Should have a clients property and must be an array.');
	}

	async process({ clients: clientCodes } = this.data) {

		await this.saveClients(clientCodes);

		await Invoker.call('MongoDBIndexCreator');

		return this.postSaveHook(clientCodes);
	}

	async saveClients(clientCodes) {

		await ModelFormatter.prepareSettings();

		const clientsToCreate = clientCodes.map(code => ModelFormatter.format(code));

		const ClientModel = ClientFetcher.get();

		const model = new ClientModel();
		return model.multiSave(clientsToCreate);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
