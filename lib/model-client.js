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
		return ['databases', 'databasesCredentials'];
	}

	/**
	 * Get additional fields
	 * @returns {string[]|undefined} returns undefined by default
	 */
	static get additionalFields() {
		return undefined;
	}

	static get useLegacyClients() {
		return false;
	}

	static validateAdditionalFields() {

		if(!this.additionalFields)
			return;

		if(!Array.isArray(this.additionalFields))
			throw new Error('Invalid getter \'additionalFields\': Should be an array.');

		return !!this.additionalFields.length;
	}

	/**
	 * Format client for create.
	 * 	Warning: This method is also used by Janis ID.
	 * @param {Array.<Object>} clients the clients to be formatted
	 * @param {Array.<Object>} currentClients the clients found in services
	 *	@returns {Array.<Object>} returns the formatted clients ready to be created
	 */
	static async formatForCreate(clients, currentClients = []) {

		const formattedClients = [];

		for(const client of clients) {
			const currentClient = currentClients.find(({ code }) => code === client.code);
			const formattedClient = await ClientFormatter.format(client, currentClient);
			formattedClients.push(formattedClient);
		}

		return formattedClients;
	}

	static filterOutLegacyClients(clients) {
		return clients.filter(({ legacyClient }) => !legacyClient || !this.useLegacyClients);
	}
};
