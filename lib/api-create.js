'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const Creator = require('./controllers/creator');
const getClientsCodes = require('./helpers/get-clients-codes');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct.partial({
			clients: struct(['string&!empty'])
		});
	}

	async process() {

		const { clients } = this.data;

		const formattedClients = await Creator.create(clients);

		await this.postSaveHook(
			getClientsCodes(formattedClients),
			formattedClients
		);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
