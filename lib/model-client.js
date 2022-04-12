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

	static get additionalFields() {
		return undefined;
	}

	static async formatForCreate(clients) {

		if(this.additionalFields && !Array.isArray(this.additionalFields))
			throw new Error('Invalid getter \'additionalFields\': Should be an array.');

		await ClientFormatter.prepareSettings();

		return clients.map(client => ClientFormatter.format(client, this.additionalFields));
	}
};
