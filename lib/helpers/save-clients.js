'use strict';

const ModelFetcher = require('./model-fetcher');
const ModelClient = require('../model-client');
const ClientFormatter = require('./client-formatter');

module.exports = async clientCodes => {

	await ClientFormatter.prepareSettings();

	const clientsToCreate = clientCodes.map(clientCode => ModelClient.formatForCreate(clientCode));

	const ClientModel = ModelFetcher.get(); // se tiene que usar el modelo del servicio

	const model = new ClientModel();

	return model.multiSave(clientsToCreate);
};
