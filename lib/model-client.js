'use strict';

const Model = require('@janiscommerce/model');
const Settings = require('@janiscommerce/settings');

const replaceKeys = require('./helper/replace-keys');

class Client extends Model {

	get databaseKey() {
		return 'core';
	}

	static get table() {
		return 'clients';
	}

	static get uniqueIndexes() {
		return ['code'];
	}

	static get shouldCreateLogs() {
		return false;
	}

	static get excludeFieldsInLog() {
		return ['databases'];
	}

	static get databaseSettings() {

		if(!this._databaseSettings)
			this._databaseSettings = Settings.get('database');

		return this._databaseSettings;
	}

	getFormattedClient(code) {
		return {
			code,
			databases: this.prepareDatabases(code),
			status: this.constructor.statuses.active
		};
	}

	prepareDatabases(code) {

		return Object.entries(this.constructor.databaseSettings).reduce((databases, [key, dbConfig]) => {

			let formattedConfig = { ...dbConfig };

			if(!formattedConfig.write)
				formattedConfig = { write: formattedConfig };

			if(!this.shouldAddDatabaseIntoClient(key, formattedConfig))
				return;

			formattedConfig.write = replaceKeys('code', code, formattedConfig.write);

			if(formattedConfig.read)
				formattedConfig.read = replaceKeys('code', code, formattedConfig.read);

			return {
				...databases,
				[key]: formattedConfig
			};
		}, {});
	}

	shouldAddDatabaseIntoClient(key, dbConfig) {
		return key !== this.databaseKey && !dbConfig.write.isCore;
	}
}

module.exports = Client;
