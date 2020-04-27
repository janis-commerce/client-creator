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

		const modelPath = this.prototype._getModelRelativePath(entity);

		try {
			return this.prototype._getClass(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	getModelInstance(entity) {

		const modelPath = this._getModelRelativePath(entity);

		try {
			return this._getInstance(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	_getModelRelativePath(entity) {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity);
	}

	_getClass(classPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		return require(classPath);
	}

	_getInstance(classPath) {

		const TheClass = this._getClass(classPath);
		return this.session.getSessionInstance(TheClass);
	}
}

module.exports = InstanceGetter;
