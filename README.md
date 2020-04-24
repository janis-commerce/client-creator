# client-creator

[![Build Status](https://travis-ci.org/janis-commerce/client-creator.svg?branch=master)](https://travis-ci.org/janis-commerce/client-creator)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)



## Installation
```sh
npm install client-creator
```
## Configuration

After installing this package you should create or update the following files:

- ClientModel: at `path/to/root/[MS_PATH]/models/client.js`

```js
'use strict';
const {ModelClient} = require('@janiscommerce/client-creator')

module.exports = ModelClient;

```

- APICreate: at `path/to/root/[MS_PATH]/src/api/client/post.js`

```js
'use strict';
const {APICreate} = require('@janiscommerce/client-creator')

module.exports = APICreate;
```
- ListenerCreated: at `path/to/root/[MS_PATH]/src/event-listeners/id/client/created.js`

```js
'use strict';
const {ListenerCreated} = require('@janiscommerce/client-creator')

module.exports = ListenerCreated;
```

- ClientModelIndexes: at `path/to/root/[MS_PATH]/schemas/mongo/core.js`

```js
'use strict';

const {ClientModelIndexes} =  require('@janiscommerce/client-creator');

module.exports = {
	core: {
        //...ohter indexes
		...ClientModelIndexes
	}
};

```
- clientFunctions: at `path/to/root/[MS_PATH]/serverless.js`

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const Settings = require('@janiscommerce/settings');
const functions = require('./serverless/functions.json');
const {clientFunctions} =  require('@janiscommerce/client-creator');


module.exports = helper({
	hooks: [
		// other hooks
        ...functions,
        ...clientFunctions
	]
}, {
	package: {
		include: [
			'node_modules/@janiscommerce/mongodb/**',
			'schemas/mongo/**'
		]
	}
});


```

Finally, create or update `path/to/root/[MS_PATH]/.nycrc` to void coverage leaks:
```
{
  "exclude": [
    ".eslintrc.js",
    "coverage/",
    "tests/",
    "schemas/mongo/",
    "stacks-map.js",
    //... your files
    src/event-listeners/id/client/created.js
    src/models/client.js,
    src/api/client/post.js
  ],
  "extension": [
    ".js"
  ],
  "cache": true,
  "all": true,
  "default-excludes": true,
  "check-coverage": true,
  "lines": 90,
  "statements": 90,
  "functions": 90,
  "branches": 90
}
```