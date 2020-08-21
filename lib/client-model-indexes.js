'use strict';

const InstanceGetter = require('./helper/instance-getter');

const codeUnique = {
	name: 'code_unique',
	key: { code: 1 },
	unique: true
};

module.exports = () => {
	const Client = InstanceGetter.getModelClass('client');
	return { [Client.table]: [codeUnique] };
};
