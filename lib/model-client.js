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

	/**
	 * Get additional fields
	 * @returns {string[]|undefined} returns undefined by default
	 */
	static get additionalFields() {
		return undefined;
	}

	static validateAdditionalFields() {

		if(!this.additionalFields)
			return;

		if(!Array.isArray(this.additionalFields))
			throw new Error('Invalid getter \'additionalFields\': Should be an array.');

		return !!this.additionalFields.length;
	}

	static async formatForCreate(clients) {
		await ClientFormatter.prepareSettings();
		return clients.map(client => ClientFormatter.format(client, this.additionalFields));
	}
};
