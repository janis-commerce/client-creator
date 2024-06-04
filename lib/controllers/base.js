'use strict';

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

	static async getCurrentClients({ clientsCodes, clientsIds }, fields) {

		return this.model.get({
			...fields && { fields },
			filters: {
				...clientsIds && { id: clientsIds },
				...clientsCodes && { code: clientsCodes }
			},
			limit: clientsIds?.length || clientsCodes.length
		});
	}
};
