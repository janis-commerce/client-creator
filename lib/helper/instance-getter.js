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

		const modelPath = this.prototype.getModelRelativePath(entity);

		try {
			return this.prototype.getClass(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	getModelInstance(entity) {

		const modelPath = this.getModelRelativePath(entity);

		try {
			return this.getInstance(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	getModelRelativePath(entity) {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity);
	}

	getClass(classPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		return require(classPath);
	}

	getInstance(classPath) {

		const TheClass = this.getClass(classPath);
		return this.session.getSessionInstance(TheClass);
	}
}

module.exports = InstanceGetter;
