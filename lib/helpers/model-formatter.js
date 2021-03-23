'use strict';

const Settings = require('@janiscommerce/settings');

const replaceKeys = require('./replace-keys');

const CredentialsFetcher = require('./credentials-fetcher');

const ClientModel = require('./client-model-fetcher');

module.exports = class ModelFormatter {

	static async prepareSettings() {

		this.settings = {};

		const settings = Settings.get('newClientsDatabases');

		if(!settings)
			return;

		let shouldFetchCredentials = false;

		Object.entries(settings)
			.forEach(([dbKey, dbKeyConfig]) => {

				if(!dbKeyConfig.write)
					dbKeyConfig = { write: dbKeyConfig };

				this.settings[dbKey] = dbKeyConfig;

				Object.values(dbKeyConfig)
					.forEach(config => {
						if(this.shouldFetchCredentials(config))
							shouldFetchCredentials = true;
					});
			});

		if(shouldFetchCredentials)
			await CredentialsFetcher.fetch();
	}

	static shouldFetchCredentials(config) {
		return (!process.env.JANIS_ENV || process.env.JANIS_ENV !== 'local')
			&& (typeof config.skipFetchCredentials === 'undefined' || config.skipFetchCredentials === false);
	}

	static format(code) {
		return {
			code,
			databases: this.prepareDatabases(code),
			status: ClientModel.statuses.active
		};
	}

	static prepareDatabases(code) {
		return Object.entries(this.settings)
			.reduce((preparedDatabases, [key, dbConfig]) => ({
				...preparedDatabases,
				[key]: this.formatDatabase(key, code, dbConfig)
			}), {});
	}

	static formatDatabase(key, code, dbConfig) {
		return Object.entries(dbConfig)
			.reduce((formattedConfig, [accessType, config]) => {

				formattedConfig[accessType] = {
					...replaceKeys('code', code, config),
					...this.shouldFetchCredentials(config) && CredentialsFetcher.get(key, accessType)
				};

				return formattedConfig;

			}, {});
	}
};
