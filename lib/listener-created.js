'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const ModelGetter = require('./helper/model-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get model() {
		return ModelGetter.getInstance();
	}

	async process(clientCode = this.eventId) {

		await this.model.save(this.model.getFormattedClient(clientCode));

		await mongoDBIndexCreator.executeForClientCode(clientCode);

		return this.postSaveHook(clientCode);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
