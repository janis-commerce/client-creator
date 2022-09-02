'use strict';

const logger = require('lllog')();

const { Invoker } = require('@janiscommerce/lambda');

const Base = require('./base');

module.exports = class Creator extends Base {

	static async create(clientsCodes, clients) {

		if(!clients) {

			clients = this.ClientModel.validateAdditionalFields()
				? await this.getIDClients({ clientsCodes })
				: clientsCodes.map(code => ({ code }));

			if(!clients?.length) {
				logger.error('Unable to get Janis ID clients, they won\'t be created.');
				return;
			}

			if(clients.length !== clientsCodes.length)
				logger.warn('Some clients couldn\'t be obtained from Janis ID service, they won\'t be created.');

		}

		const formattedClients = await this.ClientModel.formatForCreate(clients);

		logger.info('Creating client/s', formattedClients.map(({ code }) => code));

		await this.model.multiSave(formattedClients);

		await Invoker.call('MongoDBIndexCreator');

		return formattedClients;
	}

};
