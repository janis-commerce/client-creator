# client-creator

![Build Status](https://github.com/janis-commerce/client-creator/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fclient-creator.svg)](https://www.npmjs.com/package/@janiscommerce/client-creator)

## Introduction
This package includes all the generic functionality to create, update and remove a client from the services. Its main purpose is to avoid code repetition.

## :inbox_tray: Installation
```sh
npm install @janiscommerce/client-creator
```

## :hammer_and_wrench: Configuration

### AWS Parameter Store

_Since 7.1.0_
Retrieves database configurations for clients directly from AWS Parameter Store `{process.env.JANIS_SERVICE_NAME}-databases` and store configuration in `db` new field

Parameter Store expected parsed content
```json
{
  "newClientsDatabases": {
    "default": "6728b0de39a492eee4fcdaa8"
  }
}
```

Client created
```json
{
  "code": "client-code",
  "db": {
    "default": {
      "id": "6728b0de39a492eee4fcdaa8",
      "database": "service-name-client-code"
    }
  },
  "status": "active"
}
```

> :warning: The client models will be dispatched using @janiscommerce/model@^8.8.0

### Service Settings ⚠️ **Deprecated**
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

### 🔑 Secrets ⚠️ **Deprecated**
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

### Skip Credential Fetching ⚠️ **Deprecated**

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

:sparkles::new::sparkles: **Additional Fields**
Additional fields is a *getter* that allows the service to customize the clients fields, this is useful when a service needs their own custom data in clients.

> #### :information_source: This will affect Client Create API and also Client Updated Event behavior
> When a client is created or modified, the current client will be obtained from ID service and **only the additional fields that exist in the getter** will be saved in the service along with the basic client fields.

<details>
  <summary>Examples using additionalFields()</summary>

**Model configuration**

```js
'use strict';

const { ModelClient } = require('@janiscommerce/client-creator');

module.exports = class MyModelClient extends ModelClient {

  static get additionalFields() {
    return [
      'myAdditionalField',
      'anotherAdditionalField'
    ]
  }
};
```

**If a new client is created with these additional fields:**

```json
{
  "name": "Some Client",
  "code": "some-client",
  "myAdditionalField": "some-additional-data",
  "anotherAdditionalField": "another-additional-data",
  "unusedAdditionalField": "unused-data"
}
```

**The client will be saved in the service with only the specified additional fields:**

```json
{
  "name": "Some Client",
  "code": "some-client",
  "myAdditionalField": "some-additional-data",
  "anotherAdditionalField": "another-additional-data"
}
```

</details>

### APICreate
This Api will create new clients received in `clients` parameter.

Parameters:
- clients `string Array`: The clients codes to be created. _optional_
- processClients `boolean`: If received as **true** will compare Service clients with Janis ID clients and create, update or remove clients when needed. _optional_

File location `./[MS_PATH]/api/client/post.js`

#### Basic version

```js
'use strict';

const { APICreate } = require('@janiscommerce/client-creator');

module.exports = APICreate;
```

#### `postSaveHook(clientCodes, clients)`
Receives the clientCodes and clients from the API.

Parameters:
- clientCodes `string Array`: The client created codes.
- clients `object Array`: The clients created objects that were saved.

:information_source: This hook is used when received `clients` or `processClients` (when need to create)


<details>
  <summary>Example using ApiCreate postSaveHook()</summary>

```js
'use strict';

const { APICreate } = require('@janiscommerce/client-creator');

module.exports = class ClientCreateAPI extends APICreate {

  async postSaveHook(clientCodes, clients) {

      await myPostSaveMethod(clientCodes);

      clientCodes.forEach(clientCode => {
          console.log(`Saved client ${clientCode}, now i'm gonna do something great`);
      })

      clients.forEach(({ databases, status }) => {
        console.log(`This epic client has ${databases.length} databases and its status is ${status}`)
      })
    }
};
```
</details>

#### `postUpdateHook(clients)`
Hook called after update clients.

:information_source: This hook is used when received `processClients` (when no need to create)

Parameters:
- clients `object`: The recently updated client.

#### `postRemoveHook(clients)`
Hook called after remove clients.

:information_source: This hook is used when received `processClients` (when found clients to remove in service)

Parameters:
- clientsCodes `string Array`: The recently removed client codes.

### ListenerCreated
This listener handles a created event emitted by Janis ID service. It allows to create a new client in the core database and set a new database for him.

File location `./[MS_PATH]/event-listeners/id/client/created.js`

#### Basic version

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);
```

#### `postSaveHook(clientCode, client)`
Receives the clientCode and client from the event.

Parameters:
- clientCode `string`: The client created code of the created client.
- client `object`: The client created object that was saved.

<details>
  <summary>Example using ListenerCreated postSaveHook()</summary>

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

class ClientCreatedListener extends ListenerCreated {

  async postSaveHook(clientCode, client) {
    console.log(`Saved client ${clientCode}, now i'm gonna do something great`);
    console.log(`Saved client has ${client.databases.length} databases! Whoaaa`)
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientCreatedListener, ...args);
```

</details>

### ListenerUpdated
This listener handles an updated event emitted by Janis ID service. It allows to activate or deactivate a client by changing his status.

File location `./[MS_PATH]/event-listeners/id/client/updated.js`

#### Basic version

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerUpdated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerUpdated, ...args);
```

#### `postSaveHook(currentClient)`
Receives the currentClient from the event.

Parameters:
- currentClient `object`: The recently updated client.

<details>
  <summary>Example using ListenerUpdated postSaveHook()</summary>

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerUpdated } = require('@janiscommerce/client-creator');

class ClientUpdatedListener extends ListenerUpdated {

  async postSaveHook(currentClient) {
    console.log(`Saved client ${currentClient.name}, now i'm gonna do something great`);
  }
}

module.exports.handler = (...args) => ServerlessHandler.handle(ClientUpdatedListener, ...args);
```
</details>

### ListenerRemoved
This listener handles a removed event emitted by Janis ID service. It allows to remove a client from the core clients database and drop his database.

File location `./[MS_PATH]/event-listeners/id/client/removed.js`

#### Basic version

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerRemoved } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerRemoved, ...args);
```

#### `postRemovedHook(clientCode)`
Receives the removed clientCode from the API.

Parameters:
- clientCode `string`: The client removed code.

<details>
  <summary>Example using ListenerRemoved postRemovedHook()</summary>

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

</details>

### Serverless functions
The package exports `clientFunctions`, an array with serverless functions to simplify the usage. It has the hooks for the Create Api and Listeners.

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

### Tests and coverage

The _default_ Api and Listeners (:warning: without customization) not need to be tested.

To avoid coverage leaks, in `./.nycrc`

```json
{
  "exclude": [
    //... other excluded files
    "src/event-listeners/id/client/",
    "src/models/client.js",
    "src/api/client/post.js"
  ]
}
```

> :warning: If exists any customization of the files, do not add the file to the .nycrc and add the corresponding tests.