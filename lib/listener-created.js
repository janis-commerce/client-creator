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

		if(!this._clientModel) {
			const instanceGetter = this.session.getSessionInstance(InstanceGetter);
			this._clientModel = instanceGetter.getModelInstance('client');
		}

		return this._clientModel;
	}

	async process(clientCode = this.eventId) {

		const databaseSettings = Settings.get('database')[this.clientModel.databaseKey];

		const clientDatabase = {
			dbHost: databaseSettings.host,
			dbDatabase: `janis-${clientCode}`
		};

		if(databaseSettings.protocol)
			clientDatabase.dbProtocol = databaseSettings.protocol;

		if(databaseSettings.port)
			clientDatabase.dbPort = databaseSettings.port;

		if(databaseSettings.user)
			clientDatabase.dbUser = databaseSettings.user;

		if(databaseSettings.password)
			clientDatabase.dbPassword = databaseSettings.password;


		await this.clientModel.save({
			code: clientCode,
			status: this.clientModel.constructor.statuses.active,
			...clientDatabase
		});

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
