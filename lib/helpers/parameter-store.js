'use strict';

const {
	SSMClient,
	GetParameterCommand
} = require('@aws-sdk/client-ssm');

const logger = require('lllog')();

module.exports = class ParameterStore {

	static get parameterName() {
		return `${process.env.JANIS_SERVICE_NAME}-databases`;
	}

	static async set() {

		this.parameter = {};

		try {

			const ssmClient = new SSMClient();

			const response = await ssmClient.send(new GetParameterCommand({ Name: this.parameterName }));

			this.parameter = JSON.parse(response.Parameter.Value);

		} catch(error) {
			logger.error(`Unable to get ParameterStore ${this.parameterName} - ${error.message}`);
		}
	}
};
