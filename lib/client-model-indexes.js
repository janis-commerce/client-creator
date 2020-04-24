'use strict';

const Client = require('./model-client');

const codeUnique = {
	name: 'code_unique',
	key: { code: 1 },
	unique: true
};

module.exports = {
	core: {
		[Client.table]: [codeUnique]
	}
};
