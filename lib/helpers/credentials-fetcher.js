'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');

module.exports = class CredentialsFetcher {

	static get secretName() {
		return process.env.JANIS_SERVICE_NAME;
	}

	static get(key, accessType) {
		return this.secretValue
			&& this.secretValue.databases
			&& this.secretValue.databases[key]
			&& this.secretValue.databases[key][accessType];
	}

	static async fetch() {

		if(this.secretValue)
			return;

		try {

			console.log(this.secretName);

			const secretHandler = AwsSecretsManager.secret(this.secretName);

			this.secretValue = await secretHandler.getValue();

		} catch(err) {
			console.log(err);
			this.secretValue = {};
			// nothing to do here
			// no explota en este punto así dejamos que algún Driver se conecte por contexto, sin credenciales
		}
	}
};
