'use strict';

const assert = require('assert');
const mockRequire = require('mock-require');
const path = require('path');
const InstanceGetter = require('../lib/helper/instance-getter');
const ClientModel = require('../lib/model-client');

const fakeClientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');


describe('InstanceGetter', () => {

	describe('Getters', () => {

		beforeEach(() => {
			mockRequire(fakeClientPath, ClientModel);
		});

		afterEach(() => {
			mockRequire.stop(fakeClientPath);
		});

		it('should return the class', () => {
			assert.deepStrictEqual(InstanceGetter.getModelClass('client'), ClientModel);
		});

		it('should throw an error when path doesn not exists', () => {
			assert.throws(() => InstanceGetter.getModelClass('fake'), Error);
		});
	});
});
