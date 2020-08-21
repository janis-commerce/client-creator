'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const MongoDBIndexCreator = require('@janiscommerce/mongodb-index-creator');
const InstanceGetter = require('./helper/instance-getter');

const mongoDBIndexCreator = new MongoDBIndexCreator();

class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get clientModel() {

		if(!this._clientModel)
			this._clientModel = InstanceGetter.getModelInstance('client');

		return this._clientModel;
	}

	async process(clientCode = this.eventId) {

		await this.clientModel.save(this.clientModel.getFormattedClient(clientCode));

		await mongoDBIndexCreator.executeForClientCode(clientCode);

		return this.postSaveHook(clientCode);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
}

module.exports = ClientCreatedListener;
