'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const { ApiSession } = require('@janiscommerce/api-session');

const DefaultClientModel = require('./model-default-client');
const ModelGetter = require('./helper/model-getter');


module.exports = class ClientRemovedListener extends EventListener {

	get mustHaveClient() {
		return true;
	}

	get Model() {

		return ModelGetter.getInstance();
	}

	get DefaultModel() {

		return this.clientSession.getSessionInstance(DefaultClientModel);
	}

	async process(clientCode = this.eventClient) {

		const [clientToDrop] = await this.Model.getBy('code', clientCode);

		this.clientSession = new ApiSession(null, clientToDrop);

		await this.DefaultModel.dropDatabase();

		await this.Model.remove({ code: clientCode });

		return this.postSaveHook();
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
