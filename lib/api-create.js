'use strict';

const { API } = require('@janiscommerce/api');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const ModelGetter = require('./helper/model-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreateAPI extends API {

	get model() {
		return ModelGetter.getInstance();
	}

	async validate(data = this.data) {

		if(data === null || typeof data !== 'object' || Array.isArray(data))
			throw new Error('Invalid data: Should be an object, also not an array.');

		if(!Array.isArray(data.clients))
			throw new Error('Invalid data: Should have a clients property and must be an array.');
	}

	async process({ clients: clientCodes } = this.data) {

		const clientsToCreate = clientCodes.map(code => this.model.getFormattedClient(code));

		await this.model.multiSave(clientsToCreate);
		await mongoDBIndexCreator.executeForClientDatabases();

		return this.postSaveHook(clientCodes);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
