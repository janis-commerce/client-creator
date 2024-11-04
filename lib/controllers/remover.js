'use strict';

const logger = require('lllog')();

const { ApiSession } = require('@janiscommerce/api-session');
const Model = require('@janiscommerce/model');

const Base = require('./base');

module.exports = class Remover extends Base {

	static async remove(clientsCodes) {

		this.removedDatabasesClients = [];

		const currentClients = await this.getCurrentClients(clientsCodes);

		if(!currentClients.length)
			return logger.info(`Unable to get clients from ${process.env.JANIS_SERVICE_NAME}, they won\`t be removed.`); // already removed

		await Promise.all(
			currentClients.map(client => this.dropDatabase(client))
		);

		if(!this.removedDatabasesClients.length)
			return;

		await this.model.multiRemove({ code: this.removedDatabasesClients });

		logger.info(`Removed clients '${this.removedDatabasesClients.join(', ')}' from collection and their database`);

		return this.removedDatabasesClients;
	}

	static async dropDatabase(client) {

		try {

			const session = new ApiSession({
				clientId: client.id,
				clientCode: client.code
			}, client);

			const model = session.getSessionInstance(Model);

			await model.dropDatabase();

			logger.info(`Removed client ${client.code} database success`);

			this.removedDatabasesClients.push(client.code);

		} catch(error) {

			logger.error(`Error removing client ${client.code} - ${error.message}`);
		}
	}
};
