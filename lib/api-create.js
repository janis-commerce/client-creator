'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const { Invoker } = require('@janiscommerce/lambda');

const saveClients = require('./helpers/save-clients');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct({
			clients: struct(['string'])
		});
	}

	async process({ clients: clientCodes } = this.data) {

		await saveClients(clientCodes);

		await Invoker.call('MongoDBIndexCreator');

		return this.postSaveHook(clientCodes);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
