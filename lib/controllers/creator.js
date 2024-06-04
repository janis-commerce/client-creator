'use strict';

const logger = require('lllog')();

const { Invoker } = require('@janiscommerce/lambda');

const Base = require('./base');

const ID = require('./id');

const getClientsCodes = require('../helpers/get-clients-codes');

module.exports = class Creator extends Base {

	static async create(clientsCodes) {

		let clients = await ID.getClientsByCode(clientsCodes);

		if(!clients?.length)
			throw new Error('Unable to get Janis ID clients, they won\'t be created.');

		if(clients.length !== clientsCodes.length)
			logger.warn('Some clients couldn\'t be obtained from Janis ID service, they won\'t be created.');

		clients = this.ClientModel.filterOutLegacyClients(clients);

		if(!clients.length)
			return;

		const currentClients = await this.getCurrentClients({ clientsCodes }, ['code', 'databasesCredentials']);

		const formattedClients = await this.ClientModel.formatForCreate(clients, currentClients);

		logger.info('Creating client/s', getClientsCodes(formattedClients));

		await this.model.multiSave(formattedClients);

		await Invoker.call('MongoDBIndexCreator');

		return formattedClients;
	}
};
