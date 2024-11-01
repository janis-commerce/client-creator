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

	static async getCurrentClients(clientsCodes) {
		return this.model.get({
			filters: { code: clientsCodes },
			limit: clientsCodes.length
		});
	}
};
