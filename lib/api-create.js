'use strict';

const { API } = require('@janiscommerce/api');
const Settings = require('@janiscommerce/settings');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const InstanceGetter = require('./helper/instance-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

class ClientCreateAPI extends API {

	get clientModel() {

		if(!this._clientModel)
			this._clientModel = InstanceGetter.getModelInstance('client');

		return this._clientModel;
	}

	async validate(data = this.data) {

		if(data === null || typeof data !== 'object' || Array.isArray(data))
			throw new Error('Invalid data: Should be an object, also not an array.');

		if(!Array.isArray(data.clients))
			throw new Error('Invalid data: Should have a clients property and must be an array.');
	}

	async process({ clients: clientCodes } = this.data) {

		const databaseSettings = Settings.get('database')[this.clientModel.newClientsDatabaseKey];

		const clientsToCreate = clientCodes.map(code => {
			return {
				...databaseSettings,
				...this.clientModel.getFormattedClient(code)
			};
		});

		await this.clientModel.multiSave(clientsToCreate);
		await mongoDBIndexCreator.executeForClientDatabases();

		return this.postSaveHook(clientCodes, databaseSettings);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
}

module.exports = ClientCreateAPI;
