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

## Changes _Since `5.0.0`_
- 🆙 Upgraded `@janiscommerce/model` up to `^5.0.0`
- 🆙 Upgraded `@janiscommerce/mongodb-index-creator` up to `^2.0.0`
- ⚠️ Removed `clientModelIndexes`, the indexes now are included in `ModelClient` ✅

## Configuration
After installing this package you should create or update the following files:

### Service Settings
You should configure the database config in your service for the new clients using the package [Settings](https://www.npmjs.com/package/@janiscommerce/settings) and the `newClientsDatabases`

#### .janiscommercerc.json
```json
{
  "newClientsDatabases": {
    "default": { // DB config that the new clients will use
      "type": "mongodb",
      "host": "clients-host",
      "database": "janis-{{code}}" // necesary to add dinamic database name. Since 3.0.0
      // ...
    },
    "other-database": {
      "write": {
        "type": "solr",
        "host": "host-solr",
        "database": "core-{{code}}"
      },
      "read": {
        "type": "solr",
        "host": "host-read-solr",
        "database": "core-{{code}}"
      }
    }
  }
}
```

If we create a `foo` client with the previous settings, we will get the following client

```json
{
  "code": "foo",
  "databases": {
    "default": {
      "write": {
        "type": "mongodb",
        "host": "clients-host",
        "database": "janis-foo"
      }
    },
    "other-database": {
      "write": {
        "type": "solr",
        "host": "host-solr",
        "database": "core-foo"
      },
      "read": {
        "type": "solr",
        "host": "host-read-solr",
        "database": "core-foo"
      }
    }
  },
  "status": "active"
}
```

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

### clientFunctions
At `./serverless.js`

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const { clientFunctions } = require('@janiscommerce/client-creator');

module.exports = helper({
	hooks: [
		// other hooks
		...clientFunctions
	]
});
```

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

#### `postSaveHook(clientCodes)`
Receives the clientCodes from the API.

Parameters:
- clientCodes `string Array`: The client created codes.

##### Example
```js
'use strict';
const { APICreate } = require('@janiscommerce/client-creator');

class ClientCreateAPI extends APICreate {

  async postSaveHook(clientCodes) {

      await myPostSaveMethod(clientCodes);

      clientCodes.forEach(clientCode => {
          console.log(`Saved client ${clientCode}, now i'm gonna do something great`);
      })
    }
}

module.exports = ClientCreateAPI;
```

#### ListenerCreated

#### `postSaveHook(clientCode)`
Receives the clientCode from the event.

Parameters:
- clientCode `string`: The client created code.gs of the created client.

##### Example
```js
'use strict';
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

class ClientCreateListener extends ListenerCreated {

  async postSaveHook(clientCode) {
    console.log(`Saved client ${clientCode}, now i'm gonna do something great`);
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientCreateListener, ...args);
```
