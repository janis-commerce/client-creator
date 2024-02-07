'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const Creator = require('./controllers/creator');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct.partial({
			clients: struct(['string&!empty'])
		});
	}

	async process() {

		const { clients } = this.data;

		const formattedClients = await Creator.create(clients);

		return formattedClients?.length && this.postSaveHook(clients, formattedClients);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
