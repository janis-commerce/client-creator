'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const ModelGetter = require('./helper/model-getter');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get model() {
		return ModelGetter.getInstance();
	}

	async process() {

		const clientId = this.eventId;

		const currentClient = await this.getCurrentClient(clientId);

		if(!currentClient)
			return;

		await this.model.update({ status: currentClient.status }, { code: currentClient.code });

		return this.postSaveHook(clientId);
	}

	async getCurrentClient(clientId) {

		const msCall = new MicroserviceCall();

		const response = await msCall.safeCall('id', 'client', 'get', null, null, clientId);

		if(msCall.shouldRetry(response)) {
			const msCallError = (response.body && response.body.message) ? `${response.body.message}` : 'Unable to get client in Janis ID Service';
			throw new Error(msCallError);
		}

		return response.statusCode < 400 && response.body;
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
