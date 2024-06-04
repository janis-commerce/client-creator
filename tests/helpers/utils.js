'use strict';

let originalEnvs;

module.exports.setEnv = env => {

	if(!originalEnvs)
		originalEnvs = { ...process.env };

	process.env.JANIS_ENV = env;
};

module.exports.setJanisServiceName = janisServiceName => {

	if(!originalEnvs)
		originalEnvs = { ...process.env };

	process.env.JANIS_SERVICE_NAME = janisServiceName;
};

module.exports.restoreEnvs = () => {
	process.env = { ...originalEnvs };
};
