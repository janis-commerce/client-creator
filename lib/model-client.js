'use strict';

const Model = require('@janiscommerce/model');
const Settings = require('@janiscommerce/settings');

const replaceKeys = require('./helper/replace-keys');

module.exports = class Client extends Model {

	get databaseKey() {
		return 'core';
	}

	static get table() {
		return 'clients';
	}

	static get indexes() {
		return [{
			name: 'code_unique',
			key: { code: 1 },
			unique: true
		}];
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
			databases: this._prepareDatabases(code),
			status: this.constructor.statuses.active
		};
	}

	_prepareDatabases(code) {

		return Object.entries(this.constructor.databaseSettings)
			.reduce((databases, [key, dbConfig]) => {

				const formattedDatabase = this._formatDatabase(code, key, dbConfig);

				if(!formattedDatabase)
					return;

				return {
					...databases,
					[key]: formattedDatabase
				};
			}, {});
	}

	_formatDatabase(clientCode, key, dbConfig) {

		let formattedConfig = { ...dbConfig };

		if(!formattedConfig.write)
			formattedConfig = { write: formattedConfig };

		if(!this._shouldAddDatabaseIntoClient(key, formattedConfig))
			return;

		formattedConfig.write = replaceKeys('code', clientCode, formattedConfig.write);

		if(formattedConfig.read)
			formattedConfig.read = replaceKeys('code', clientCode, formattedConfig.read);

		return formattedConfig;
	}

	_shouldAddDatabaseIntoClient(key, dbConfig) {
		return key !== this.databaseKey && !dbConfig.write.isCore;
	}
};
