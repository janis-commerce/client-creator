'use strict';

const logger = require('lllog')();

const Settings = require('@janiscommerce/settings');

const ParameterStore = require('./parameter-store');

const CredentialsFetcher = require('./credentials-fetcher');

const replaceKeys = require('./replace-keys');

const ModelFetcher = require('./model-fetcher');

module.exports = class ClientFormatter {

	static get ClientModel() {
		return ModelFetcher.get(); // se tiene que usar el modelo del servicio
	}

	static async format({ code, status, ...restOfClient }, currentClient) {

		await this.setDependencies();

		return {
			code,
			...this.formatDB(code, currentClient),
			...this.formatDatabasesDeprecated(code),
			status: currentClient ? status : this.ClientModel.statuses.active,
			...this.ClientModel.additionalFields?.reduce((additionalFields, field) => {

				if(typeof restOfClient[field] !== 'undefined')
					additionalFields[field] = restOfClient[field];
				else if(currentClient) {

					if(!additionalFields.$unset)
						additionalFields.$unset = [];

					additionalFields.$unset.push(field); // this sync MS client with ID client
				}

				return additionalFields;

			}, {})
		};
	}

	static formatDB(clientCode, currentClient) {

		const newClientsDatabases = ParameterStore.get();

		if(!Object.keys(newClientsDatabases).length)
			return {};

		return Object.entries(newClientsDatabases)
			.reduce((clientDatabases, [databaseKey, databaseId]) => {

				clientDatabases.db[databaseKey] = {
					id: currentClient?.db?.[databaseKey]?.id // current id
						|| databaseId,
					database: currentClient?.db?.[databaseKey]?.database // current format
						|| currentClient?.databases?.[databaseKey]?.write?.database // old format
						|| currentClient?.databases?.[databaseKey]?.database // oldest format
						|| `${process.env.JANIS_SERVICE_NAME}-${clientCode}` // default
				};

				return clientDatabases;

			}, {
				db: {}
			});
	}

	/**
	 * @deprecated
	 */
	static formatDatabasesDeprecated(code) {

		if(!Object.keys(this.settings).length)
			return {};

		return Object.entries(this.settings)
			.reduce((preparedDatabases, [key, dbConfig]) => {
				preparedDatabases.databases[key] = this.formatDatabase(key, code, dbConfig);
				return preparedDatabases;
			}, {
				databases: {}
			});
	}

	/**
	 * @deprecated
	 */
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
			ParameterStore.set(),
			this.setSettings()
		]);

		this.dependenciesAreSet = true;
	}

	/**
	 * @deprecated
	 */
	static async setSettings() {

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

		await CredentialsFetcher.fetch();
	}

	/**
	 * Exclusive for testing purposes
	 */
	static restore() {
		this.dependenciesAreSet = undefined;
		this.settings = undefined;
		ParameterStore.parameter = undefined;
	}
};
