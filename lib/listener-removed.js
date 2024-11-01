'use strict';

const { EventListener } = require('@janiscommerce/event-listener');

const Remover = require('./controllers/remover');

module.exports = class ClientRemovedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientsCode = this.eventId;

		const result = await Remover.remove([clientsCode]);

		return result && this.postRemovedHook(clientsCode);
	}

	/**
	 * It executes after removing.
	 */
	async postRemovedHook() {
		return true;
	}
};
