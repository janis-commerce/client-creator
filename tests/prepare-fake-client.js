'use strict';

const { ModelClient } = require('../lib');

module.exports = code => ({
	code,
	databases: {
		default: {
			write: {
				host: 'database-host',
				database: `janis-${code}`,
				someLimit: 10
			}
		},
		onlyWriteDB: {
			write: {
				host: 'write-database-host',
				database: `janis-write-${code}`
			}
		},
		completeDB: {
			write: {
				host: 'complete-write-database-host',
				database: `janis-complete-write-${code}`
			},
			read: {
				host: 'complete-read-database-host',
				database: `janis-complete-read-${code}`
			}
		}
	},
	status: ModelClient.statuses.active
});
