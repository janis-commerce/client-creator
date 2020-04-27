'use strict';

const InstanceGetter = require('./helper/instance-getter');

const Client = InstanceGetter.getModelClass('client');

const codeUnique = {
	name: 'code_unique',
	key: { code: 1 },
	unique: true
};

module.exports = {
	[Client.table]: [codeUnique]
};
