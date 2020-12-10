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

	async process() {

		const code = this.eventId;

		await this.model.save(this.model.getFormattedClient(code));

		await mongoDBIndexCreator.executeForClientCode(code);

		return this.postSaveHook(code);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
