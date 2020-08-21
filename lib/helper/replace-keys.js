'use strict';

/**
 * Reaplces key with value in the object recieved
 * @param {string} key
 * @param {any} value
 * @param {object} obj
 */
module.exports = (key, value, obj) => {
	return Object.entries(obj).reduce((acum, [objKey, objValue]) => {
		return {
			...acum,
			[objKey]: typeof objValue === 'string' ? objValue.replace(`{{${key}}}`, value) : objValue
		};
	}, {});
};
