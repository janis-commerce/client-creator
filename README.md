# client-creator

[![Build Status](https://travis-ci.org/janis-commerce/client-creator.svg?branch=master)](https://travis-ci.org/janis-commerce/client-creator)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-creator/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-creator?branch=master)



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
const { ListenerCreated } = require('@janiscommerce/client-creator')

module.exports = ListenerCreated;
```

### ClientModelIndexes
At `path/to/root/[MS_PATH]/schemas/mongo/core.js`

```js
'use strict';

const { ClientModelIndexes } =  require('@janiscommerce/client-creator');

module.exports = {
	core: {
        //...ohter indexes
		...ClientModelIndexes
	}
};

```

### clientFunctions
At `path/to/root/[MS_PATH]/serverless.js`

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const Settings = require('@janiscommerce/settings');
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
			'node_modules/@janiscommerce/mongodb/**',
			'schemas/mongo/**'
		]
	}
});


```

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