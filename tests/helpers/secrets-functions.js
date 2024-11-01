'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');
const CredentialsFetcher = require('../../lib/helpers/credentials-fetcher');

const SecretHandler = class SecretHandler {
	getValue() {}
};

const cleanCredentialsCache = () => {
	CredentialsFetcher.secretValue = undefined;
};

const stubGetSecret = (sinon, value) => {

	cleanCredentialsCache();

	sinon.stub(AwsSecretsManager, 'secret')
		.returns(new SecretHandler());

	sinon.stub(SecretHandler.prototype, 'getValue')
		.resolves(value || {});
};

const secretThrows = sinon => {

	cleanCredentialsCache();

	sinon.stub(AwsSecretsManager, 'secret')
		.throws(new Error('some secret error'));
};

const getValueRejects = sinon => {

	cleanCredentialsCache();

	sinon.stub(AwsSecretsManager, 'secret')
		.returns(new SecretHandler());

	sinon.stub(SecretHandler.prototype, 'getValue')
		.rejects(new Error('some getValue error'));
};

const assertSecretsGet = (sinon, secretName) => {
	sinon.assert.calledOnceWithExactly(AwsSecretsManager.secret, secretName);
	sinon.assert.calledOnceWithExactly(SecretHandler.prototype.getValue);
};

const secretsNotCalled = sinon => {
	sinon.assert.notCalled(AwsSecretsManager.secret);
	sinon.assert.notCalled(SecretHandler.prototype.getValue);
};

module.exports = {
	cleanCredentialsCache,
	stubGetSecret,
	secretThrows,
	getValueRejects,
	assertSecretsGet,
	secretsNotCalled
};
