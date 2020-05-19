'use strict';

const Model = require('@janiscommerce/model');
const Settings = require('@janiscommerce/settings');

class Client extends Model {

	static get settings() {
		return Settings.get('clients') || {};
	}

	get databaseKey() {
		return this.constructor.settings.databaseKey || 'core';
	}

	static get table() {
		return this.settings.table || 'clients';
	}

	static get uniqueIndexes() {
		return [
			'id',
			'code'
		];
	}

	static get shouldCreateLogs() {
		return false;
	}

	static get excludeFieldsInLog() {
		return ['dbUser', 'dbPassword', 'dbHost'];
	}
}

module.exports = Client;
