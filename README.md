# client-creator

![Build Status](https://github.com/janis-commerce/client-creator/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fclient-creator.svg)](https://www.npmjs.com/package/@janiscommerce/client-creator)

## Introduction
This package includes all the generic functionality to create, update and remove a client from the services. Its main purpose is to avoid code repetition.

## Installation
```sh
npm install @janiscommerce/client-creator
```

## Configuration
After installing this package you should create or update the following files:

### Service Settings
You should configure the database config in your service for the new clients using the package [Settings](https://www.npmjs.com/package/@janiscommerce/settings) and the `newClientsDatabases` field

#### .janiscommercerc.json
```json
{
  "newClientsDatabases": {
    "default": { // DB config that the new clients will use
      "type": "mongodb",
      "database": "janis-{{code}}" // necessary to add dynamic database name. Since 3.0.0
    },
    "other-database": {
      "write": {
        "type": "solr",
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

If we create a `brand-new-client` client with the previous settings, we will get the following client

```json
{
  "code": "brand-new-client",
  "databases": {
    "default": {
      "write": {
        "type": "mongodb",
        "database": "janis-brand-new-client"
      }
    },
    "other-database": {
      "write": {
        "type": "solr",
        "database": "core-brand-new-client"
      },
      "read": {
        "type": "solr",
        "database": "core-brand-new-client"
      }
    }
  },
  "status": "active"
}
```
 
### 🔑 Secrets 
The package will get the **secret** using the *JANIS_SERVICE_NAME* environment variable.  
If the **secret** was found, the result will be merged with the settings found in the *`janiscommercerc.json`* in the `newClientsDatabases` field.

The Secrets are stored in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager) and obtained with the package [@janiscommerce/aws-secrets-manager](https://www.npmjs.com/package/@janiscommerce/aws-secrets-manager) 

<details>
	<summary>Complete example in which the settings are obtained in the settings file and merged with the fetched credentials in AWS Secrets Manager.</summary>

In the example will be used a new client **brand-new-client**.

1. Settings in file.

```json
{
  "newClientsDatabases": {
    "default": {
      "type": "mongodb",
      "database": "janis-{{code}}"
    }
  }
}
```

2. Secret fetched.

```json
{
	"databases": {
    "default": {
      "write": {
        "host": "mongodb+srv://some-host.mongodb.net",
        "user": "secure-user",
        "password": "secure-password",
      }
    }
	}
}
```

3. Settings merged after fetching the Secret

```json
{
	"default": {
		"write": {
			"type": "mongodb",
			"database": "janis-brand-new-client",
			"host": "mongodb+srv://some-host.mongodb.net",
			"user": "secure-user",
			"password": "secure-password",
		}
	}
}
```

</details>

### Skip Credential Fetching

To skip the fetch of the credentials, it can be used the setting `skipFetchCredentials` set as **true**.

```json
{
  "newClientsDatabases": {
    "default": {
      "write": {
        "type": "mongodb",
        "skipFetchCredentials": true,
        "protocol": "mongodb+srv://",
        "host": "mongodb+srv://some-host.mongodb.net",
        "user": "some-user",
        "password": "insecure-password"
      }
    }
  }
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
This listener handles a created event emitted by Janis ID service. It allows to create a new client in the core database and set a new database for him.  
Use it at `./[MS_PATH]/event-listeners/id/client/created.js`

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);
```

### ListenerUpdated
This listener handles an updated event emitted by Janis ID service. It allows to activate or deactivate a client by changing his status.  

Use it at `./[MS_PATH]/event-listeners/id/client/updated.js`

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerUpdated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerUpdated, ...args);
```

### ListenerRemoved
This listener handles a removed event emitted by Janis ID service. It allows to remove a client from the core clients database and drop his database.  

Use it at `./[MS_PATH]/event-listeners/id/client/removed.js`

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerRemoved } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerRemoved, ...args);
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
Add schemas for the Client Created, Updated and Removed event listeners and the Create Client API post. Subscribe to events.

At ` ./schemas/client/` add these two files:
- [create.yml](schemas/create.yml)
- [base.yml](schemas/base.yml)


At ` ./schemas/event-listeners/id/client` add this file: 
- [created.yml](schemas/created.yml)
- [updated.yml](schemas/updated.yml)
- [removed.yml](schemas/removed.yml)

At ` ./events/src/id/` add this file: 
- [client.yml](schemas/client.yml)

Finally, create or update `./.nycrc` to avoid coverage leaks:
```
{
  "exclude": [
    //... your files
    "src/event-listeners/id/client/created.js",
    "src/event-listeners/id/client/updated.js",
    "src/event-listeners/id/client/removed.js",
    "src/models/client.js",
    "src/api/client/post.js"
  ]
}
```

:warning: If exists any customization of the files, do not add the file to the .nyrcr and add the corresponding tests.

### Hooks
The `APICreate` and `listeners` have a hook for post processing the client or clients created data.

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

#### Listener Created   
#### `postSaveHook(clientCode)`
Receives the clientCode from the event.

Parameters:
- clientCode `string`: The client created code.gs of the created client.

It can be implemented as the example bellow:
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

#### Listener Updated 
#### `postSaveHook(currentClient)`
Receives the currentClient from the event.

Parameters:
- currentClient `object`: The recently updated client.

It can be implemented as the example bellow:
##### Example
```js
'use strict';
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerUpdated } = require('@janiscommerce/client-creator');

class ClientUpdateListener extends ListenerUpdated {

  async postSaveHook(currentClient) {
    console.log(`Saved client ${currentClient.name}, now i'm gonna do something great`);
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientUpdateListener, ...args);
```

#### Listener Removed  
#### `postRemovedHook(clientCode)`
Receives the removed clientCode from the API.

Parameters:
- clientCode `string`: The client removed code.  

It can be implemented as the example bellow:

##### Example
```js
'use strict';
const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerRemoved } = require('@janiscommerce/client-creator');

class ClientRemovedListener extends ListenerRemoved {

  async postRemovedHook(clientCode) {
    console.log(`Saved client ${clientCode}, now i'm gonna do something great`);
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientRemovedListener, ...args);
```
