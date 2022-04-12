'use strict';

const logger = require('lllog')();

const { EventListener } = require('@janiscommerce/event-listener');
const MicroserviceCall = require('@janiscommerce/microservice-call');

const ModelFetcher = require('./helpers/model-fetcher');

module.exports = class ClientUpdatedListener extends EventListener {

	get mustHaveId() {
		return true;
	}

	async process() {

		const clientId = this.eventId;

		const updatedClient = await this.getUpdatedClient(clientId);

		if(!updatedClient) {
			logger.error('Unable to get Janis ID client, it won\'t be updated.');
			return;
		}

		await this.updateServiceClient(updatedClient);

		return this.postSaveHook(updatedClient);
	}

	async getUpdatedClient(clientId) {

		const msCall = new MicroserviceCall();

		const { statusCode, body } = await msCall.safeCall('id', 'client', 'get', null, null, { id: clientId });

		if(statusCode >= 500) {
			const errorMessage = body && body.message ? `${body.message}` : 'Service failed';
			throw new Error(`Failed to get Janis ID client: ${errorMessage}`);
		}

		return statusCode < 400 && body;
	}

	updateServiceClient({ code, status, ...updatedClient }) {

		const ClientModel = ModelFetcher.get();
		const model = new ClientModel();

		const fieldsToUpdate = { status };
		const fieldsToRemove = {};

		if(ClientModel.additionalFields) {

			if(!Array.isArray(ClientModel.additionalFields))
				throw new Error('Invalid getter \'additionalFields\': Should be an array.');

			ClientModel.additionalFields.forEach(fieldName => {

				if(updatedClient[fieldName])
					fieldsToUpdate[fieldName] = updatedClient[fieldName];
				else
					fieldsToRemove[fieldName] = '';
			});
		}

		return model.update({ ...fieldsToUpdate, ...Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove } }, { code });
	}

	/**
	 * It executes after updating.
	 */
	async postSaveHook() {
		return true;
	}
};
