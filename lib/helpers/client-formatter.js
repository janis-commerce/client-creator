'use strict';

const Settings = require('@janiscommerce/settings');

const replaceKeys = require('./replace-keys');

const CredentialsFetcher = require('./credentials-fetcher');

const ModelFetcher = require('./model-fetcher');

module.exports = class ClientFormatter {

	static get statusActive() {

		if(!this._statusActive) {
			const ClientModel = ModelFetcher.get();
			this._statusActive = ClientModel.statuses.active;
		}

		return this._statusActive;
	}

	static format({ code, ...client }, additionalFields) {

		const formattedClient = {
			code,
			databases: this.prepareDatabases(code),
			status: this.statusActive
		};

		if(additionalFields) {

			additionalFields.forEach(field => {

				if(client[field])
					formattedClient[field] = client[field];
			});
		}

		return formattedClient;
	}

	static prepareDatabases(code) {
		return Object.entries(this.settings)
			.reduce((preparedDatabases, [key, dbConfig]) => ({
				...preparedDatabases,
				[key]: this.formatDatabase(key, code, dbConfig)
			}), {});
	}

	static formatDatabase(key, code, dbConfig) {

		/**
		 * Se formatea cada base de datos de las settings
		 * - se reemplaza la variable code por el client.code
		 * - se agregan las credenciales que se encontraron en AWS Secrets Manager para esa config de DB
		 */

		return Object.entries(dbConfig)
			.reduce((formattedConfig, [accessType, config]) => {

				formattedConfig[accessType] = {
					...replaceKeys('code', code, config),
					...this.shouldFetchCredentials(config) && CredentialsFetcher.get(key, accessType)
				};

				return formattedConfig;

			}, {});
	}

	static async prepareSettings() {

		this.settings = {};

		const settings = Settings.get('newClientsDatabases');

		if(!settings)
			return;

		let shouldFetchCredentials = false;

		/**
		 * recorre las settings de newClientsDatabases del servicio
		 * - puede ser que el servicio no tenga la forma 'write' y tenga la config directa, arregla ese caso
		 * - asigna las settings formateadas a this.settings
		 * - guarda shouldFetchCredentials si es necesario consultar en AWS Secrets Manager
		 */

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

		// Si es necesario, se hace 1 unico fetch() para que ya quede guardado en CredentialsFetcher
		if(shouldFetchCredentials)
			await CredentialsFetcher.fetch();
	}

	static shouldFetchCredentials(config) {
		return (!process.env.JANIS_ENV || process.env.JANIS_ENV !== 'local')
			&& (typeof config.skipFetchCredentials === 'undefined' || config.skipFetchCredentials === false);
	}
};
