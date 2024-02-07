'use strict';

const logger = require('lllog')();

const { ApiSession } = require('@janiscommerce/api-session');
const Model = require('@janiscommerce/model');

const Base = require('./base');

module.exports = class Remover extends Base {

	static async remove(clientsCodes) {

		this.removedDatabasesClients = [];

		const clients = await this.getServiceClients({ clientsCodes });

		if(!clients.length) {
			logger.error('Unable to get Janis ID clients, it won\'t be updated.');
			return;
		}

		logger.info('Starting removing clients');

		await Promise.all(
			clients.map(client => this.dropDatabase(client))
		);

		if(!this.removedDatabasesClients.length)
			return;

		await this.model.multiRemove({ code: this.removedDatabasesClients });

		logger.info(`Removed clients '${this.removedDatabasesClients.join(', ')}' from collection and their database`);

		return this.removedDatabasesClients;
	}

	static async dropDatabase(client) {

		logger.info(`Removing client ${client.code} database`);

		const session = new ApiSession({
			clientId: client.id,
			clientCode: client.code
		}, client);

		const modelWithSession = session.getSessionInstance(Model);

		await modelWithSession.dropDatabase();

		logger.info(`Removed client ${client.code} database success`);

		this.removedDatabasesClients.push(client.code);
	}
};
