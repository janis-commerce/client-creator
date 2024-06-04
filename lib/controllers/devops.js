'use strict';

const { Invoker } = require('@janiscommerce/lambda');

module.exports = class Devops {

	static async getService() 	{

		const { statusCode, payload } = await Invoker.serviceCall('devops', 'GetService', {
			fields: ['id', 'code', 'clientDatabases'],
			filters: { code: process.env.JANIS_SERVICE_NAME },
			limit: 1
		});

		if(statusCode >= 400 || !payload?.items[0])
			throw new Error(`Unable to get service ${process.env.JANIS_SERVICE_NAME} from Devops`);

		return payload?.items[0];
	}
};
