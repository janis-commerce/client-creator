'use strict';

const { API } = require('@janiscommerce/api');
const Settings = require('@janiscommerce/settings');
const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');

const mongoDBIndexCreator = new MongoDBIndexCreator();

const ClientModel = require('./model-client');

class ClientCreateAPI extends API {

	async validate(data = this.data) {

		if(data === null || typeof data !== 'object' || Array.isArray(data))
			throw new Error('Invalid data: Should be an object, also not an array.');

		if(!Array.isArray(data.clients))
			throw new Error('Invalid data: Should have a clients property and must be an array.');
	}

	async process({ clients } = this.data) {

		const clientModel = new ClientModel();

		const databaseSettings = Settings.get('database')[clientModel.databaseKey];

		const clientDatabase = {
			dbHost: databaseSettings.host
		};

		if(databaseSettings.protocol)
			clientDatabase.dbProtocol = databaseSettings.protocol;

		if(databaseSettings.port)
			clientDatabase.dbPort = databaseSettings.port;

		if(databaseSettings.user)
			clientDatabase.dbUser = databaseSettings.user;

		if(databaseSettings.password)
			clientDatabase.dbPassword = databaseSettings.password;

		const clientsToCreate = clients.map(client => ({
			code: client,
			status: ClientModel.statuses.active,
			...clientDatabase,
			dbDatabase: `janis-${client}`
		}));

		await clientModel.multiSave(clientsToCreate);
		await mongoDBIndexCreator.executeForClientDatabases();

	}
}

module.exports = ClientCreateAPI;
