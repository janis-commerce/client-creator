# client-creator

![Build Status](https://github.com/janis-commerce/client-creator/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fclient-creator.svg)](https://www.npmjs.com/package/@janiscommerce/client-creator)

## Introduction
This package includes all the generic functionality of the creation of a client at the services. It main purpose is to avoid code repetition.

## Installation
```sh
npm install @janiscommerce/client-creator
```
## Configuration

After installing this package you should create or update the following files:

### Service settings (.janiscommercerc)
You should configure the database config in your service, in order to get the correct DB config for new clients:

#### .janiscommercerc.json
```js
{
  "database": {
    "core": { // DB config where save new clients
      "type": "mongodb",
      "host": "core-host"
      // ...
    },
    "default": { // DB config that the clients will use
      "type": "mongodb",
      "host": "clients-host",
      "database": "janis-{{code}}" // necesary to add dinamic database name. Since 3.0.0
      // ...
    }
  },
  "clients": {
    "newClientsDatabaseKey": "newClients", // The new clients config databaseKey ("newClients" by default)
    "databaseKey": "core", // The databaseKey where store the new clients ("core" by default)
    "table": "clients" // The clients table where create the clients ("clients" by default)
  }
}
```

_(since 3.0.0)_

**The database name is required in the "newClients" settings is required!!!**
This field should be the same in the database.newClients and clients.fields.write[database] and clients.fields.read[database] (if used)

### ClientModel
At `./[MS_PATH]/models/client.js`

```js
'use strict';
const { ModelClient } = require('@janiscommerce/client-creator');

module.exports = ModelClient;
```

### APICreate
At `./[MS_PATH]/api/client/post.js`

```js
'use strict';
const { APICreate } = require('@janiscommerce/client-creator');

module.exports = APICreate;
```

### ListenerCreated
At `./[MS_PATH]/event-listeners/id/client/created.js`

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);
```

### clientModelIndexes
At `./schemas/mongo/core.js`

```js
'use strict';

const { clientModelIndexes } = require('@janiscommerce/client-creator');

module.exports = {
	core: {
		//...ohter indexes
		...clientModelIndexes()
	}
};
```

### clientFunctions
At `./serverless.js`

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const { clientFunctions } = require('@janiscommerce/client-creator');
const functions = require('./serverless/functions.json');

module.exports = helper({
	hooks: [
		// other hooks
		...functions,
		...clientFunctions
	]
});
```
:warning: If they exist, delete the functions from the `./serverless/functions.json` file.

### Schemas
Add schemas for the Client Created event listener and the Create Client API post. Subscribe to events.

At ` ./schemas/client/` add these two files:
- [create.yml](schemas/create.yml)
- [base.yml](schemas/base.yml)


At ` ./schemas/event-listeners/id/client` add this file: 
- [created.yml](schemas/created.yml)

At ` ./events/src/id/` add this file: 
- [client.yml](schemas/client.yml)

Finally, create or update `./.nycrc` to avoid coverage leaks:
```
{
  "exclude": [
    //... your files
    "src/event-listeners/id/client/created.js",
    "src/models/client.js",
    "src/api/client/post.js"
  ]
}
```

:warning: If exists any customization of the files, do not add the file to the .nyrcr and add the corresponding tests.

### Hooks
Both `APICreate` and `ListenerCreated` have a hook for post processing the client or clients created data.

#### APICreate

#### `postSaveHook(clientCodes, databaseSettings)`
Receives the clientCodes from the API and the databaseSettings for the created clients.

Parameters:
- clientCodes `string Array`: The client created codes .
- databaseSettings `Object`: The database settings of the created clients.

##### Example
```js
'use strict';
const { APICreate } = require('@janiscommerce/client-creator');

class ClientCreateAPI extends APICreate {

  async postSaveHook(clientCodes, databaseSettings) {

      await myPostSaveMethod(clientCodes, databaseSettings);

      clientCodes.forEach(code => {
          console.log(`Saved client ${code} with host: ${databaseSettings.host}`);
      })
    }
}

module.exports = ClientCreateAPI;
```

#### ListenerCreated

#### `postSaveHook(clientCode, databaseSettings)`
Receives the clientCode from the event and the databaseSettings for the created client.

Parameters:
- clientCode `string`: The client created code .
- databaseSettings `Object`: The database settings of the created client.

##### Example
```js
'use strict';
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

class ClientCreateListener extends ListenerCreated {

  async postSaveHook(clientCode, databaseSettings) {

    await myPostSaveMethod(clientCode, databaseSettings);

    console.log(`Saved client ${code} with host: ${databaseSettings.host}`);
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientCreateListener, ...args);
```
