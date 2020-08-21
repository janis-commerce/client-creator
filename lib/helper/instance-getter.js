'use strict';

const path = require('path');

class InstanceGetter {

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	static getModelInstance(entity) {
		const TheClass = this.getModelClass(entity);
		return new TheClass();
	}

	/**
	 * Returns a class model from the service
	 *
	 * @param {string} entity
	 * @memberof InstanceGetter
	 */
	static getModelClass(entity) {

		const modelPath = this.getModelRelativePath(entity);

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			return require(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	static getModelRelativePath(entity) {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity);
	}
}

module.exports = InstanceGetter;
