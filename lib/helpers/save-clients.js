'use strict';

const ModelFetcher = require('./model-fetcher');
const ModelClient = require('../model-client');

module.exports = async clientCodes => {

	const clientsToCreate = await Promise.all(
		clientCodes.map(clientCode => ModelClient.formatForCreate(clientCode))
	);

	const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio

	const model = new ClientModel();

	return model.multiSave(clientsToCreate);
};
