'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const Creator = require('./controllers/creator');

module.exports = class ClientCreatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		// this.eventId is the code of the Client in Janis ID

		const formattedClient = await Creator.create([this.eventId]);

		await this.postSaveHook(this.eventId, formattedClient[0]);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}
};
