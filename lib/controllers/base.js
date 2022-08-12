'use strict';

const logger = require('lllog')();

const { Invoker } = require('@janiscommerce/lambda');

const ModelFetcher = require('../helpers/model-fetcher');

module.exports = class Base {

	static get ClientModel() {
		return ModelFetcher.get(); // se tiene que usar el modelo del servicio
	}

	static get model() {

		if(!this._model)
			this._model = new this.ClientModel();

		return this._model;
	}

	static async getIDClients({ clientsIds, clientsCodes } = {}) 	{

		const { statusCode, payload } = await Invoker.serviceCall('id', 'GetClient', {
			filters: {
				...clientsIds && { id: clientsIds },
				...clientsCodes && { clientCode: clientsCodes }
			},
			...clientsIds && { limit: clientsIds.length },
			...clientsCodes && { limit: clientsCodes.length }
		});

		if(statusCode >= 500)
			throw new Error('Failed to get Janis ID clients');

		if(statusCode >= 400)
			logger.error(`Janis ID getting clients response statusCode: ${statusCode}.`);

		return payload && payload.items;
	}

	static async getServiceClients(clientsCodes) {

		const filters = {
			...clientsCodes && { code: clientsCodes }
		};

		return this.model.get({ filters });
	}
};
