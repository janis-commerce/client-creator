'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');
const CredentialsFetcher = require('../../lib/helpers/credentials-fetcher');

const SecretHandler = class SecretHandler {
	getValue() {}
};

const cleanCredentialsCache = () => {
	CredentialsFetcher.secretValue = undefined;
};

const stubGetSecret = (sandbox, value) => {

	cleanCredentialsCache();

	sandbox.stub(AwsSecretsManager, 'secret')
		.returns(new SecretHandler());

	sandbox.stub(SecretHandler.prototype, 'getValue')
		.resolves(value || {});
};

const secretThrows = sandbox => {

	cleanCredentialsCache();

	sandbox.stub(AwsSecretsManager, 'secret')
		.throws(new Error('some secret error'));
};

const getValueRejects = sandbox => {

	cleanCredentialsCache();

	sandbox.stub(AwsSecretsManager, 'secret')
		.returns(new SecretHandler());

	sandbox.stub(SecretHandler.prototype, 'getValue')
		.rejects(new Error('some getValue error'));
};

const assertSecretsGet = (sandbox, secretName) => {
	sandbox.assert.calledOnceWithExactly(AwsSecretsManager.secret, secretName);
	sandbox.assert.calledOnceWithExactly(SecretHandler.prototype.getValue);
};

const secretsNotCalled = sandbox => {
	sandbox.assert.notCalled(AwsSecretsManager.secret);
	sandbox.assert.notCalled(SecretHandler.prototype.getValue);
};

const setEnv = env => {
	process.env.JANIS_ENV = env;
};

module.exports = {
	cleanCredentialsCache,
	stubGetSecret,
	secretThrows,
	getValueRejects,
	assertSecretsGet,
	secretsNotCalled,
	setEnv
};
