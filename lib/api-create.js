'use strict';

const logger = require('lllog')();

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const { Invoker } = require('@janiscommerce/lambda');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const ModelFetcher = require('./helpers/model-fetcher');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct({
			clients: struct(['string'])
		});
	}

	async process({ clients: clientCodes } = this.data) {

		const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio
		const model = new ClientModel();

		const clients = await this.getClients(clientCodes);

		if(!clients) {
			logger.error('Unable to get Janis ID clients, they won\'t be created.');
			return;
		}

		if(clients.length !== clientCodes.length)
			logger.warn('Some clients couldn\'t be get from Janis ID service, they won\'t be created.');

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

	async getClients(clientCodes) {

		const msCall = new MicroserviceCall();

		const { statusCode, body } = await msCall.safeList('id', 'client', { filters: { clientCode: clientCodes } });

		if(statusCode >= 500) {
			const errorMessage = body && body.message ? `${body.message}` : 'Service failed';
			throw new Error(`Failed to get Janis ID clients: ${errorMessage}`);
		}

		return statusCode < 400 && body.length && body;
	}
};
