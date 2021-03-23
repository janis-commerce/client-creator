'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');

module.exports = class CredentialsFetcher {

	static get secretName() {
		return process.env.JANIS_SERVICE_NAME;
	}

	static get(key, type) {
		return this.secretValue
			&& this.secretValue[key]
			&& this.secretValue[key][type];
	}

	static async fetch() {

		if(this.secretValue)
			return;

		try {

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
