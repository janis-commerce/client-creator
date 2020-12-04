'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const msCall = new MicroserviceCall();
const ModelGetter = require('./helper/model-getter');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get model() {
		return ModelGetter.getInstance();
	}

	async process(clientCode = this.eventId) {

		const { body: currentClient } = await msCall.safeCall('id', 'client', 'get', clientCode);

		await this.model.update({ status: currentClient.status }, { code: currentClient.code });

		return this.postSaveHook(clientCode);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
