'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const Settings = require('@janiscommerce/settings');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const ClientModel = require('./model-client');
const InstanceGetter = require('./helper/instance-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process(clientCode = this.eventId) {

		const instanceGetter = this.session.getSessionInstance(InstanceGetter);

		const clientModel = instanceGetter.getModelInstance('client');

		const databaseSettings = Settings.get('database')[clientModel.databaseKey];

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


		await clientModel.save({
			code: clientCode,
			status: ClientModel.statuses.active,
			...clientDatabase
		});

		await mongoDBIndexCreator.executeForClientCode(clientCode);
		await this.postSaveHook(clientCode);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
}

module.exports = ClientCreatedListener;
