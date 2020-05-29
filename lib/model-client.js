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

	get newClientsDatabaseKey() {
		return this.constructor.settings.newClientsDatabaseKey || 'newClients';
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
		return ['user', 'password', 'host', 'protocol', 'port', 'database'];
	}

	getFormattedClient(code, databaseSettings = {}) {

		const settings = Object.entries(databaseSettings).reduce((acum, [key, value]) => {
			return {
				...acum,
				[key]: typeof value === 'string' ? value.replace('{{code}}', code) : value
			};
		}, {});

		return {
			code,
			status: this.constructor.statuses.active,
			...settings
		};
	}
}

module.exports = Client;
