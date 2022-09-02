'use strict';

const logger = require('lllog')();

const { ApiSession } = require('@janiscommerce/api-session');
const Model = require('@janiscommerce/model');

const Base = require('./base');

module.exports = class Remover extends Base {

	static async remove(clientsCodes, clients) {

		this.clientsCodes = [];

		if(!clients) {

			clients = await this.getServiceClients(clientsCodes);

			if(!clients.length) {
				logger.error('Unable to get Janis ID clients, it won\'t be updated.');
				return;
			}
		}

		logger.info('Starting removing clients');

		await Promise.all(
			clients.map(client => this.dropDatabase(client))
		);

		await this.model.multiRemove({ code: this.clientsCodes });

		logger.info('Clients were removed from clients collection and databases');

		return this.clientsCodes;
	}

	static dropDatabase(client) {

		logger.info(`Removing client ${client.code} database`);

		this.clientsCodes.push(client.code);

		const session = new ApiSession({
			clientId: client.id,
			clientCode: client.code
		}, client);

		const modelWithSession = session.getSessionInstance(Model);

		return modelWithSession.dropDatabase();
	}
};
