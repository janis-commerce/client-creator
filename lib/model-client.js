'use strict';

const Model = require('@janiscommerce/model');

class Client extends Model {

	get databaseKey() {
		return 'newClients';
	}

	static get table() {
		return 'clients';
	}

	static get uniqueIndexes() {
		return [
			'id',
			'code'
		];
	}

	static shouldCreateLogs() {
		return false;
	}

	static get excludeFieldsInLog() {
		return ['dbUser', 'dbPassword', 'dbHost'];
	}
}

module.exports = Client;
