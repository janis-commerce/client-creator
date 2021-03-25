'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const ClientFetcher = require('./helpers/client-model-fetcher');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientId = this.eventId;

		const updatedClient = await this.getUpdatedClient(clientId);

		if(!updatedClient)
			return;

		await this.updateServiceClient(updatedClient);

		return this.postSaveHook(updatedClient);
	}

	async getUpdatedClient(clientId) {

		const msCall = new MicroserviceCall();

		const response = await msCall.safeCall('id', 'client', 'get', null, null, { id: clientId });

		if(msCall.shouldRetry(response)) {
			const msCallError = (response.body && response.body.message) ? `${response.body.message}` : 'Unable to get Janis ID client';
			throw new Error(msCallError);
		}

		return response.statusCode < 400 && response.body;
	}

	updateServiceClient(updatedClient) {

		const ClientModel = ClientFetcher.get();
		const model = new ClientModel();

		return model.update({
			status: updatedClient.status
		}, {
			code: updatedClient.code
		});
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
