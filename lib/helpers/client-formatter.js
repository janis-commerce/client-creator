'use strict';

const logger = require('lllog')();

const Settings = require('@janiscommerce/settings');

const replaceKeys = require('./replace-keys');

const CredentialsFetcher = require('./credentials-fetcher');

const ModelFetcher = require('./model-fetcher');

const Devops = require('../controllers/devops');

module.exports = class ClientFormatter {

	static get ClientModel() {
		return ModelFetcher.get(); // se tiene que usar el modelo del servicio
	}

	static async format({ code, status, ...client }, currentClient) {

		await this.setDependencies();

		return {
			code,
			databasesCredentials: this.prepareDatabasesCredentials(code, currentClient),
			databases: this.prepareDatabasesDeprecatedFormat(code),
			status: currentClient ? status : this.ClientModel.statuses.active,
			...this.ClientModel.additionalFields.reduce((additionalFields, field) => {

				if(typeof client[field] !== 'undefined')
					additionalFields[field] = client[field];
				else if(currentClient) {

					if(!additionalFields.$unset)
						additionalFields.$unset = [];

					additionalFields.$unset.push(field);
				}

				return additionalFields;

			}, {})
		};
	}

	static prepareDatabasesCredentials(clientCode, currentClient) {

		if(currentClient?.databasesCredentials)
			return currentClient.databasesCredentials; // ya tiene el formato correcto el cliente actual

		return this.service?.clientDatabases.reduce((clientDatabases, { databaseKey, newClientsDatabase }) => {

			const dbName = currentClient.databases[databaseKey].write.database
				|| currentClient.databases[databaseKey].database
				|| `${this.service.code}-${clientCode}`;

			clientDatabases[databaseKey] = { dbId: newClientsDatabase, dbName };

			return clientDatabases;

		}, {});
	}

	static prepareDatabasesDeprecatedFormat(code) {
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
					...CredentialsFetcher.get(key, accessType)
				};

				return formattedConfig;

			}, {});
	}

	static async setDependencies() {

		if(this.dependenciesAreSet)
			return;

		await Promise.all([
			this.setService(),
			this.setSettings()
		]);

		this.dependenciesAreSet = true;
	}

	static async setService() {
		this.service = await Devops.getService();
	}

	static setSettings() {

		this.settings = {};

		const settings = Settings.get('newClientsDatabases');

		if(!settings)
			return;

		logger.warn('Settings usage is deprecated, newClientsDatabases must be configured in Devops Service');

		/**
		 * recorre las settings de newClientsDatabases del servicio
		 * - puede ser que el servicio no tenga la forma 'write' y tenga la config directa, arregla ese caso
		 * - asigna las settings formateadas a this.settings
		 */

		Object.entries(settings).forEach(([dbKey, dbKeyConfig]) => {

			if(!dbKeyConfig.write)
				dbKeyConfig = { write: dbKeyConfig };

			if(!dbKeyConfig.admin)
				dbKeyConfig.admin = dbKeyConfig.write;

			this.settings[dbKey] = dbKeyConfig;
		});

		return CredentialsFetcher.fetch();
	}

	/**
	 * Exclusive for testing purposes
	 */
	static restore() {
		this.dependenciesAreSet = undefined;
		this.settings = undefined;
		this.service = undefined;
	}
};
