'use strict';

const Model = require('@janiscommerce/model');

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

	static get shouldCreateLogs() {
		return false;
	}

	static get excludeFieldsInLog() {
		return ['databases'];
	}
};
