'use strict';

const Model = require('@janiscommerce/model');

const ClientFormatter = require('./helpers/client-formatter');

module.exports = class Client extends Model {

	get databaseKey() {
		return 'core';
	}

	static get table() {
		return 'clients';
	}

	static get indexes() {
		return [{
			name: 'code_unique',
			key: { code: 1 },
			unique: true
		}];
	}

	static get shouldCreateLogs() {
		return false;
	}

	static get excludeFieldsInLog() {
		return ['databases'];
	}

	static async formatForCreate(clientCodes) {

		await ClientFormatter.prepareSettings();

		const isMultiple = Array.isArray(clientCodes);

		if(!isMultiple)
			clientCodes = [clientCodes];

		const formattedClients = clientCodes.map(clientCode => ClientFormatter.format(clientCode));

		return isMultiple ? formattedClients : formattedClients[0];
	}
};
