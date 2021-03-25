'use strict';

const { ModelClient } = require('../lib');

module.exports = (code, addSecureData = false) => ({
	code,
	databases: {
		default: {
			write: {
				skipFetchCredentials: true,
				host: 'database-host',
				database: `janis-${code}`,
				someLimit: 10
			}
		},
		onlyWriteDB: {
			write: {
				skipFetchCredentials: true,
				host: 'write-database-host',
				database: `janis-write-${code}`
			}
		},
		completeDB: {
			write: {
				skipFetchCredentials: true,
				host: 'complete-write-database-host',
				database: `janis-complete-write-${code}`
			},
			read: {
				skipFetchCredentials: true,
				host: 'complete-read-database-host',
				database: `janis-complete-read-${code}`
			}
		},
		secureDB: {
			write: {
				database: `secure-${code}`,
				...addSecureData && {
					host: 'secure-host',
					user: 'secure-user',
					password: 'secure-password'
				}
			}
		}
	},
	status: ModelClient.statuses.active
});
