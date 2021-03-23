'use strict';

const { EventListener } = require('@janiscommerce/event-listener');
const Model = require('@janiscommerce/model');

const ClientModel = require('./helpers/client-model-fetcher');

module.exports = class ClientRemovedListener extends EventListener {

	get mustHaveClient() {
		return true;
	}

	get model() {

		if(this._model)
			this._model = new ClientModel();

		return this._model;
	}

	async process() {

		const code = this.eventClient;

		const clientToDrop = await this.model.getBy('code', code, { unique: true });

		if(!clientToDrop) {
			this.setCode(404).setBody('Client not found in Service');
			return;
		}

		await this.dropDatabase();

		await this.removeClient(code);

		return this.postRemovedHook(code);
	}

	dropDatabase() {

		const modelWithSession = this.session.getSessionInstance(Model);

		return modelWithSession.dropDatabase();
	}

	removeClient(code) {
		return this.model.remove({ code });
	}

	/**
	 * It executes after removing.
	 */
	async postRemovedHook() {
		return true;
	}
};
