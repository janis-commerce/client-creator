'use strict';

const logger = require('lllog')();

const getClientsCodes = require('../helpers/get-clients-codes');

const Base = require('./base');

const ID = require('./id');

module.exports = class Updater extends Base {

	static async update(clientsIds) {

		this.ClientModel.validateAdditionalFields();

		const clients = await ID.getClientsById(clientsIds);

		if(!clients?.length)
			throw new Error('Unable to get Janis ID clients, it won\'t be updated.');

		const currentClients = await this.getCurrentClients(getClientsCodes(clients));

		const formattedClients = await this.ClientModel.formatForCreate(clients, currentClients);

		logger.info('Updating client/s', getClientsCodes(formattedClients));

		await this.model.multiSave(formattedClients);

		return clients;
	}
};
