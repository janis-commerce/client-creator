'use strict';

const path = require('path');

module.exports = class ModelFetcher {

	/**
     * Returns an instance model from the service.
     * @param {string} entity
     */
	static get() {

		const modelPath = this.getModelRelativePath();

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			return require(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model Client. Must be in ${modelPath}.`);
		}
	}

	static getModelRelativePath() {
		/* istanbul ignore next */
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
	}
};
