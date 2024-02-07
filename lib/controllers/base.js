'use strict';

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

	static async getService() 	{

		const { statusCode, payload } = await Invoker.serviceCall('devops', 'GetService', {
			fields: ['id', 'code', 'clientDatabases'],
			filters: { code: process.env.JANIS_SERVICE_NAME },
			limit: 1
		});

		if(statusCode >= 400 || !payload?.items[0])
			throw new Error('Unable to get Service from Devops');

		return payload?.items[0];
	}

	static async getIDClients({ clientsCodes, clientsIds }) 	{

		const { statusCode, payload } = await Invoker.serviceCall('id', 'GetClient', {
			filters: {
				...clientsIds && { id: clientsIds },
				...clientsCodes && { code: clientsCodes }
			},
			limit: clientsIds?.length || clientsCodes.length
		});

		if(statusCode >= 400)
			throw new Error('Failed to get Janis ID clients');

		return payload && payload.items;
	}

	static async getServiceClients({ clientsCodes, clientsIds }) {

		return this.model.get({
			filters: {
				...clientsIds && { id: clientsIds },
				...clientsCodes && { code: clientsCodes }
			},
			limit: clientsIds?.length || clientsCodes.length
		});
	}
};
