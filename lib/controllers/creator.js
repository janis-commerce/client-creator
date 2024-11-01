'use strict';

const logger = require('lllog')();

const { Invoker } = require('@janiscommerce/lambda');

const Base = require('./base');

const ID = require('./id');

const getClientsCodes = require('../helpers/get-clients-codes');

module.exports = class Creator extends Base {

	static async create(clientsCodes) {

		const clients = await ID.getClientsByCode(clientsCodes);

		if(!clients?.length)
			throw new Error('Unable to get Janis ID client/s, they won\'t be created.');

		if(clients.length !== clientsCodes.length)
			logger.warn('Some clients couldn\'t be obtained from Janis ID service, they won\'t be created.');

		const currentClients = await this.getCurrentClients(getClientsCodes(clients));

		const formattedClients = await this.ClientModel.formatForCreate(clients, currentClients);

		logger.info('Creating client/s', getClientsCodes(formattedClients));

		await this.model.multiSave(formattedClients);

		await Invoker.call('MongoDBIndexCreator');

		return formattedClients;
	}
};
