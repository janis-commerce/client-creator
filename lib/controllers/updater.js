'use strict';

const logger = require('lllog')();

const Base = require('./base');

module.exports = class Updater extends Base {

	static async update(clientsIds, clients) {

		if(!clients) {

			clients = await this.getIDClients({ clientsIds });

			if(!clients?.length) {
				logger.error('Unable to get Janis ID clients, it won\'t be updated.');
				return;
			}
		}

		const formattedClients = clients.map(client => this.format(client));

		logger.info('Updating client/s', formattedClients.map(({ code }) => code));

		await this.model.multiSave(formattedClients);

		return clients;
	}

	static format({ code, status, ...updatedClient }) {

		const fieldsToUpdate = { status };
		const fieldsToRemove = {};

		if(this.ClientModel.validateAdditionalFields()) {

			this.ClientModel.additionalFields.forEach(fieldName => {

				if(typeof updatedClient[fieldName] !== 'undefined')
					fieldsToUpdate[fieldName] = updatedClient[fieldName];
				else
					fieldsToRemove[fieldName] = '';
			});
		}

		return {
			code,
			...fieldsToUpdate,
			...Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }
		};
	}
};
