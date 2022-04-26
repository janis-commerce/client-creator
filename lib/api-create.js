'use strict';

const logger = require('lllog')();

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const { Invoker } = require('@janiscommerce/lambda');

const ModelFetcher = require('./helpers/model-fetcher');
const getClients = require('./helpers/get-clients');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct({
			clients: struct(['string'])
		});
	}

	async process({ clients: clientCodes } = this.data) {

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio
		const model = new ClientModel();

		const clients = ClientModel.validateAdditionalFields() ? await getClients(clientCodes) : clientCodes.map(code => ({ code }));

		if(!clients) {
			logger.error('Unable to get Janis ID clients, they won\'t be created.');
			return;
		}

		if(clients.length !== clientCodes.length)
			logger.warn('Some clients couldn\'t be obtained from Janis ID service, they won\'t be created.');

		const clientsToCreate = await ClientModel.formatForCreate(clients);

		await model.multiSave(clientsToCreate);

		await Invoker.call('MongoDBIndexCreator');

		return this.postSaveHook(clientCodes, clientsToCreate);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
