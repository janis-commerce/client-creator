'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const { ApiSession } = require('@janiscommerce/api-session');
const Model = require('@janiscommerce/model');

const ModelGetter = require('./helper/model-getter');

module.exports = class ClientRemovedListener extends EventListener {

	get mustHaveClient() {
		return true;
	}

	get model() {
		return ModelGetter.getInstance();
	}

	async process() {

		const code = this.eventClient;

		const clientToDrop = await this.model.getBy('code', code, { unique: true });

		await this.dropDatabase(clientToDrop);

		await this.removeClient(code);

		return this.postRemovedHook(code);
	}

	dropDatabase(client) {

		const session = new ApiSession(null, client);

		const model = session.getSessionInstance(Model);

		return model.dropDatabase();
	}

	removeClient(code) {
		return this.model.remove({ code });
	}

	/**
	 * It executes after saving.
	 */
	async postRemovedHook() {
		return true;
	}
};
