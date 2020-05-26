'use strict';

const path = require('path');

class InstanceGetter {

	/**
	 * Returns a class model from the service
	 *
	 * @param {string} entity
	 * @memberof InstanceGetter
	 */
	static getModelClass(entity) {

		const modelPath = this.getModelRelativePath(entity);

		try {
			return this.getClass(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	static getModelInstance(entity) {

		const modelPath = this.getModelRelativePath(entity);

		try {
			return this.getInstance(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	static getModelRelativePath(entity) {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity);
	}

	static getClass(classPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		return require(classPath);
	}

	static getInstance(classPath) {

		const TheClass = this.getClass(classPath);
		return new TheClass();
	}
}

module.exports = InstanceGetter;
