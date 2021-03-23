/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

'use strict';

const path = require('path');

const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

let modelClass;

try {
	modelClass = require(modelPath);
} catch(e) {
	throw new Error(`Invalid Model Client. Must be in ${modelPath}.`);
}

module.exports = modelClass;
