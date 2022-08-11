'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const Updater = require('./controllers/updater');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientsIds = [this.eventId];

		const formattedClient = await Updater.update(clientsIds);

		return formattedClient && this.postSaveHook(formattedClient[0]);
	}

	/**
	 * It executes after updating.
	 */
	async postSaveHook() {
		return true;
	}
};
