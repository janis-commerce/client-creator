'use strict';

const { Invoker } = require('@janiscommerce/lambda');

module.exports = class ID {

	static async getClients({ clientsCodes, clientsIds }) {

		const { statusCode, payload } = await Invoker.serviceCall('id', 'GetClient', {
			filters: {
				...clientsIds && { id: clientsIds },
				...clientsCodes && { code: clientsCodes }
			},
			limit: clientsIds?.length || clientsCodes.length
		});

		if(statusCode >= 400)
			throw new Error('Failed to get Janis ID clients');

		return payload?.items;
	}

	static getClientsByCode(clientsCodes) {
		return this.getClients({ clientsCodes });
	}

	static getClientsById(clientsIds) {
		return this.getClients({ clientsIds });
	}
};
