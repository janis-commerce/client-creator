# client-creator

[![Build Status](https://travis-ci.org/janis-commerce/client-creator.svg?branch=master)](https://travis-ci.org/janis-commerce/client-creator)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)


## Introduction
This package includes all the generic functionality of the creation of a client at the services. It main purpose is to avoid code repetition. 
## Installation
```sh
npm install @janiscommerce/client-creator
```
## Configuration

After installing this package you should create or update the following files:

### ClientModel
At `path/to/root/[MS_PATH]/models/client.js`

```js
'use strict';
const { ModelClient } = require('@janiscommerce/client-creator')

module.exports = ModelClient;

```

### APICreate
At `path/to/root/[MS_PATH]/src/api/client/post.js`

```js
'use strict';
const { APICreate } = require('@janiscommerce/client-creator')

module.exports = APICreate;
```

### ListenerCreated
At `path/to/root/[MS_PATH]/src/event-listeners/id/client/created.js`

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ListenerCreated } = require('@janiscommerce/client-creator');

module.exports.handler = (...args) => ServerlessHandler.handle(ListenerCreated, ...args);
```

### clientModelIndexes
At `path/to/root/[MS_PATH]/schemas/mongo/core.js`

```js
'use strict';

const { clientModelIndexes } =  require('@janiscommerce/client-creator');

module.exports = {
	core: {
        //...ohter indexes
		...clientModelIndexes
	}
};

```

### clientFunctions
At `path/to/root/[MS_PATH]/serverless.js`

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const functions = require('./serverless/functions.json');
const { clientFunctions } =  require('@janiscommerce/client-creator');


module.exports = helper({
	hooks: [
		// other hooks
        ...functions,
        ...clientFunctions
	]
}, {
	package: {
		include: [
			// your packages
		]
	}
});
```
:warning: If they exist, delete the functions from the` path/to/root/[MS_PATH]/serverless/functions.json` file.

Finally, create or update `path/to/root/[MS_PATH]/.nycrc` to avoid coverage leaks:
```
{
  "exclude": [
    //... your files
    src/event-listeners/id/client/created.js
    src/models/client.js,
    src/api/client/post.js
  ]
}
```

:warning: If exists any customization of the files, do not add the file to the .nyrcr and add the corresponding tests.