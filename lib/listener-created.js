'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const Creator = require('./controllers/creator');

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientsCodes = [this.eventId];

		const formattedClient = await Creator.create(clientsCodes);

		return formattedClient && this.postSaveHook(this.eventId, formattedClient[0]);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
