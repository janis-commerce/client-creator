'use strict';

const logger = require('lllog')();

const getClientsCodes = require('../helpers/get-clients-codes');

const Base = require('./base');

module.exports = class Updater extends Base {

	static async update(clientsIds) {

		let clients = await this.getIDClients({ clientsIds });

		if(!clients?.length)
			throw new Error('Unable to get Janis ID clients, it won\'t be updated.');

		if(clients.length !== clientsIds.length)
			logger.warn('Some clients couldn\'t be obtained from Janis ID service, they won\'t be updated.');

		clients = this.ClientModel.filterOutLegacyClients(clients);

		if(!clients.length)
			return;

		const currentClients = await this.getServiceClients({ clientsIds });

		const formattedClients = await this.ClientModel.formatForCreate(clients, currentClients);

		logger.info('Updating client/s', getClientsCodes(formattedClients));

		await this.model.multiSave(formattedClients);

		return clients;
	}
};
