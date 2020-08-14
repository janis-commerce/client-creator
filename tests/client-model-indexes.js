'use strict';

const assert = require('assert');
const mockRequire = require('mock-require');
const path = require('path');
const ClientModelIndexes = require('../lib/client-model-indexes');
const ClientModel = require('../lib/model-client');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const codeUnique = {
	name: 'code_unique',
	key: { code: 1 },
	unique: true
};

const clientIndex = { [ClientModel.table]: [codeUnique] };

describe('ClientModelIndexes', () => {

	it('should return the client index object when required', () => {
		mockRequire(fakeClientPath, ClientModel);
		assert.deepStrictEqual(ClientModelIndexes(), clientIndex);
		mockRequire.stop(fakeClientPath);
	});
});
