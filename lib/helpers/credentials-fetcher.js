'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');

/**
 * @deprecated
 */
module.exports = class CredentialsFetcher {

	static get secretName() {
		return process.env.JANIS_SERVICE_NAME;
	}

	static get(key, accessType) {
		return this.secretValue?.databases?.[key]?.[accessType] || {}; // devuleve un obj vacio porque del otro lado se hace un spread
	}

	static async fetch() {

		if(!this.shouldFetchCredentials())
			return;

		try {

			const secretHandler = AwsSecretsManager.secret(this.secretName);

			this.secretValue = await secretHandler.getValue();

		} catch(err) {
			this.secretValue = {};
			// nothing to do here
		}
	}

	static shouldFetchCredentials() {
		return !process.env.JANIS_ENV || process.env.JANIS_ENV !== 'local';
	}
};
