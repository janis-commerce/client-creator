'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const Controller = require('./controllers/base');
const Creator = require('./controllers/creator');
const Updater = require('./controllers/updater');
const Remover = require('./controllers/remover');

module.exports = class ClientCreateAPI extends API {

	get struct() {
		return struct({
			clients: struct(['string'])
		});
	}

	async process() {

		const { clients: clientsToCreate } = this.data;

		if(clientsToCreate)
			return this.createClients(clientsToCreate);

		return this.processClients();
	}

	async createClients(clientCodes) {

		const formattedClients = await Creator.create(clientCodes);

		return formattedClients && this.postSaveHook(clientCodes, formattedClients);
	}

	async processClients() {

		// obtener clientes de JID y del MS
		// crear los que no estén en MS
		// eliminar los que no estén en JID
		// actualizar los otros, despues de compararlos con are-objects-equals

		const [idClients, serviceClients] = await Promise.all([
			Controller.getIDClients(),
			Controller.getServiceClients()
		]);

		const [
			clientsToCreate,
			clientsToUpdate,
			clientsToRemove
		] = this.groupClients(idClients, serviceClients);

		const [
			createdClients,
			updatedClients,
			removedClients
		] = await Promise.all([
			clientsToCreate && Creator.create(null, clientsToCreate),
			clientsToUpdate && Updater.update(null, clientsToUpdate),
			clientsToRemove && Remover.remove(null, clientsToRemove)
		]);

		return Promise.all([
			createdClients && this.postSaveHook(createdClients),
			updatedClients && this.postUpdateHook(updatedClients),
			removedClients && this.postRemoveHook(removedClients)
		]);
	}

	groupClients(idClients, serviceClients) {

		const clientsToCreate = [];
		const clientsToUpdate = [];

		idClients.forEach(client => {

			const { code } = client;

			if(!this.findClient(serviceClients, code))
				clientsToCreate.push(client);
			else
				clientsToUpdate.push(client);
		});

		const clientsToRemove = serviceClients.filter(({ code }) => !this.findClient(idClients, code));

		return [clientsToCreate, clientsToUpdate, clientsToRemove];
	}

	findClient(clients, clientCode) {
		return clients.find(({ code }) => clientCode === code);
	}

	/**
	 * It executes after saving.
	 */
	async postSaveHook() {
		return true;
	}

	/**
	 * It executes after update clients.
	 */
	async postUpdateHook() {
		return true;
	}

	/**
	 * It executes after remove old clients.
	 */
	async postRemoveHook() {
		return true;
	}
};
