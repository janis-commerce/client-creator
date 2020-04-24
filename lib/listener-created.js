'use strict';

const {
	EventListener,
	ServerlessHandler
} = require('@janiscommerce/event-listener');

const Settings = require('@janiscommerce/settings');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const ClientModel = require('./model-client');

const mongoDBIndexCreator = new MongoDBIndexCreator();

class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process(clientCode = this.eventId) {

		const clientModel = new ClientModel();

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

		return Promise.all([
			mongoDBIndexCreator.executeForClientCode(clientCode),
			this.postSaveHook(clientCode)
		]);
	}

	postSaveHook() {
		return true;
	}
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientCreatedListener, ...args);
