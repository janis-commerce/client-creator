'use strict';

const { ApiSession } = require('@janiscommerce/api-session');
const { EventListener } = require('@janiscommerce/event-listener');
const Model = require('@janiscommerce/model');

const ModelFetcher = require('./helpers/model-fetcher');

module.exports = class ClientRemovedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	get model() {

		if(!this._model) {
			const ClientModel = ModelFetcher.get();
			this._model = new ClientModel();
		}

		return this._model;
	}

	get clientCode() {
		return this.eventId;
	}

	async process() {

		await this.setClient();

		if(!this.client) {
			this.setCode(404)
				.setBody('Client not found in Service');
			return;
		}

		await this.dropDatabase();

		await this.removeClient();

		return this.postRemovedHook(this.clientCode);
	}

	async setClient() {
		this.client = await this.model.getBy('code', this.clientCode, { unique: true });
	}

	dropDatabase() {

		const session = new ApiSession({
			clientId: this.client.id,
			clientCode: this.client.code
		}, this.client);

		const modelWithSession = session.getSessionInstance(Model);

		return modelWithSession.dropDatabase();
	}

	removeClient() {
		return this.model.remove({ code: this.clientCode });
	}

	/**
	 * It executes after removing.
	 */
	async postRemovedHook() {
		return true;
	}
};
