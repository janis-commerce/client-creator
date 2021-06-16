'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const { Invoker } = require('@janiscommerce/lambda');

const ModelFetcher = require('./helpers/model-fetcher');
const ModelClient = require('./model-client');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct({
			clients: struct(['string'])
		});
	}

	async process({ clients: clientCodes } = this.data) {

		const clientsToCreate = await ModelClient.formatForCreate(clientCodes);

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio

		const model = new ClientModel();

		await model.multiSave(clientsToCreate);

		await Invoker.call('MongoDBIndexCreator');

		return this.postSaveHook(clientCodes);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
