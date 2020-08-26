'use strict';

const path = require('path');

module.exports = class ModelGetter {

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	static getInstance() {

		const modelPath = this.getModelRelativePath();

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const TheClass = require(modelPath);
			return new TheClass();
		} catch(e) {
			throw new Error(`Invalid Model Client. Must be in ${modelPath}.`);
		}
	}

	static getModelRelativePath() {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
	}
};
