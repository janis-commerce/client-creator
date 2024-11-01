'use strict';

/**
 * @deprecated
 * Replaces key with value in the object received
 * @param {string} key
 * @param {any} value
 * @param {object} obj
 */
module.exports = (key, value, obj) => {
	return Object.entries(obj).reduce((replacedObject, [objKey, objValue]) => {
		return {
			...replacedObject,
			[objKey]: typeof objValue === 'string' ? objValue.replace(`{{${key}}}`, value) : objValue
		};
	}, {});
};
