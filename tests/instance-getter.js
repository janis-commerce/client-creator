'use strict';

const assert = require('assert');
const mockRequire = require('mock-require');
const path = require('path');
const InstanceGetter = require('../lib/helper/instance-getter');
const ClientModel = require('../lib/model-client');

const fakeClientPath = path.join(process.cwd(), 'models', 'client');
const fakeClientPathMS = path.join(process.cwd(), 'ms_path', 'models', 'client');

describe('InstanceGetter', () => {

	describe('Getters', () => {

		beforeEach(() => {
			mockRequire(fakeClientPath, ClientModel);
			mockRequire(fakeClientPathMS, ClientModel);
		});

		afterEach(() => {
			mockRequire.stop(fakeClientPath);
			mockRequire.stop(fakeClientPathMS);
		});

		it('should return the class when the enviroment variable is not defined', () => {

			assert.deepStrictEqual(InstanceGetter.getModelClass('client'), ClientModel);
		});

		it('should return the class when the enviroment variable is defined', () => {

			process.env.MS_PATH = 'ms_path';
			assert.deepStrictEqual(InstanceGetter.getModelClass('client'), ClientModel);
			delete (process.env.MS_PATH);
		});

		it('should throw an error when path doesn not exists', () => {
			assert.throws(() => InstanceGetter.getModelClass('fake'), Error);
		});
	});
});
