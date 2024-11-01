'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const Updater = require('./controllers/updater');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		// this.eventId is the id of the Client in Janis ID

		const formattedClient = await Updater.update([this.eventId]);

		await this.postSaveHook(formattedClient[0]);
	}

	/**
	 * It executes after updating.
	 */
	async postSaveHook() {
		return true;
	}
};
