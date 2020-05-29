'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const Settings = require('@janiscommerce/settings');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const InstanceGetter = require('./helper/instance-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get clientModel() {

		if(!this._clientModel)
			this._clientModel = InstanceGetter.getModelInstance('client');

		return this._clientModel;
	}

	async process(clientCode = this.eventId) {

		const databaseSettings = Settings.get('database')[this.clientModel.newClientsDatabaseKey];

		await this.clientModel.save(this.clientModel.getFormattedClient(clientCode, databaseSettings));

		await mongoDBIndexCreator.executeForClientCode(clientCode);
		return this.postSaveHook(clientCode, databaseSettings);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
}

module.exports = ClientCreatedListener;
