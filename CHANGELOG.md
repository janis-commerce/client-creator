# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [7.1.0] - 2024-11-15
### Added
- Using **AWS ParameterStore** to find Databases information
- Using new field `db` in clients for databases configuration

### Changed
- _Internal_ GitHub actions improved
- _Internal_ Updated to `node@18`

### Deprecated
- **AWS Secrets Manager** usage
- **Settings** usage

### Removed
- **Api Create** parameter `processClients` and feature

## [7.1.0-beta.0] - 2024-11-04
### Added
- Using **AWS ParameterStore** to find Databases information
- Using new field `db` in clients for databases configuration

### Changed
- _Internal_ GitHub actions improved
- _Internal_ Updated to `node@18`

### Deprecated
- **AWS Secrets Manager** usage
- **Settings** usage

### Removed
- **Api Create** parameter `processClients` and feature

## [7.0.0] - 2023-09-18
### Changed
- Update [@janiscommerce/api](https://www.npmjs.com/package/@janiscommerce/api) to version 8xx
- Update [@janiscommerce/event-listener](https://www.npmjs.com/package/@janiscommerce/event-listener) to version 5xx
- Update [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model) to version 8xx

## [6.0.1] - 2023-04-20
### Changed
- Update [@janiscommerce/event-listener](https://www.npmjs.com/package/@janiscommerce/event-listener) to version 4xx

## [6.0.0] - 2023-04-18
### Changed
- Update [@janiscommerce/api](https://www.npmjs.com/package/@janiscommerce/api) to version 7xx
- Update [@janiscommerce/aws-secrets-manager](https://www.npmjs.com/package/@janiscommerce/aws-secrets-manager) to version 1xx
- Update [@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/lambda) to version 6xx
- Update [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model) to version 7xx
- Update [@janiscommerce/mongodb-index-creator](https://www.npmjs.com/package/@janiscommerce/mongodb-index-creator) to version 4xx

## [5.4.5] - 2023-03-14
### Changed
- **Client Creation**. When `admin` config is missing on Databases, the config is now copied from `write`

## [5.4.4] - 2023-01-09
### Fixed
- Client `ListenerRemoved` fixed response

### Changed
- Updated `@janiscommerce/lambda` to **v5**
- Updated `@janiscommerce/mongodb-index-creator` to **v3**

## [5.4.3] - 2022-12-20
### Changed
- Updated `@janiscommerce/lambda` dependency to **v4**

## [5.4.2] - 2022-09-02
### Added
- **ApiCreate** Added response body with process resume when `processClients` para was received

## [5.4.1] - 2022-09-02
### Changed
- Added debugging loggers for create, update and remove clients

## [5.4.0] - 2022-08-16
### Added
- **ApiCreate** _optional_ parameter `processClients` to create, update or remove clients

### Changed
- Using lambda function `GetClient` instead of Client Apis

## [5.3.4] - 2022-07-01
### Fixed
- ID fails getting clients when filter by code

## [5.3.3] - 2022-07-01
### Changed
- Added logs when ID fails getting clients

## [5.3.2] - 2022-07-01
### Fixed
- ID Client Request `endpointParameters` wrong format

## [5.3.1] - 2022-06-30
### Fixed
- ID Client Request using correct `pageSize` instead of `limit`

## [5.3.0] - 2022-04-26
### Added
- `additionalFields` getter in **ModelClient** for customizing client fields
- **API Client Created** and **EventListener Client Created** `postSaveHook()` receives the created client object in second parameter.

## [5.2.5] - 2021-12-02
### Fixed
- `RemovedListener` using ApiSession to make `dropDatabase()` possible

## [5.2.4] - 2021-12-02
### Fixed
- Now `RemovedListener` uses `event.id` instead of `event.client`

## [5.2.3] - 2021-06-16
### Fixed
- Public method `formatForCreate` to formatting now prepare settings

## [5.2.2] - 2021-05-19
### Fixed
- Creation: Prepare settings before formatting

## [5.2.1] - 2021-04-19
### Added
- Public method `formatForCreate` to formatting

## [5.2.0] - 2021-03-26
### Added
- Fetched credentials in **AWS Secrets Manager** using `@janiscommerce/aws-secrets-manager`.

## [5.1.1] - 2021-02-05
### Changed
- API Create - Using Lambda.Invoker to create Indexes in MongoDB

## [5.1.0] - 2020-12-15
### Added
- `UpdatedListener` to activate or deactivate a client
- `RemovedListener` to remove a client

## [5.0.2] - 2020-09-09
### Changed
- Updated dependencies versions
- Upgraded `@janiscommerce/api` up to `^6.0.1`
- Upgraded `@janiscommerce/event-listener` up to `^3.0.0`

## [5.0.1] - 2020-08-26
### Fixed
- Replaced setting used `database` with `newClientsDatabases`

## [5.0.0] - 2020-08-26
### Added
- Model client indexes getter with `code` index

### Changed
- Upgraded `@janiscommerce/model` up to `^5.0.0`
- Upgraded `@janiscommerce/mongodb-index-creator` up to `^2.0.0`

### Removed
- Export Model client indexes

## [4.0.1] - 2020-08-21
### Fixed
- Fixed `package.json` main

## [4.0.0] - 2020-08-21
### Added
- GitHub Actions

### Changed
- Breaking Change: Now package create `databases` with each database config

### Removed
- Travis integration, replaced with GitHub Actions

## [3.0.2] - 2020-08-14
### Fixed
- Dev dependencies correctly identified

## [3.0.1] - 2020-06-18
### Changed
- Updated packages versions

## [3.0.0] - 2020-05-29
### Added
- New Clients settings can use `{{code}}` to have dinamic settings

## [2.0.1] - 2020-05-28
### Fixed
- Now client model formatted have bigger priority than `janiscommercerc` settings

## [2.0.0] - 2020-05-28
### Changed
- Settings in `janiscommercerc.json` now are no longer mapped, the newClients settings will be setted in the new client document
- Setting `database` renamed from `dbDatabase`

## [1.3.0] - 2020-05-26
### Removed
- `session` in client create API and Listener

## [1.2.0] - 2020-05-22
### Added
- `databaseSettings` parameter for `postSaveHook()` method
- `newClientsDatabaseKey` setting for new clients database config

### Changed
- `Client` Model now set the new clients databaseKey from config

### Fixed
- `Client Create API` `postSaveHook()` client codes parameter

## [1.1.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [1.0.4] - 2020-05-04
### Fixed
- Fix client-functions module client path

## [1.0.3] - 2020-04-29
### Fixed
- Fix client-model include
- Fix client-functions bad include on `index.js`

## [1.0.2] - 2020-04-29
### Fixed
- Some README.md path fixes

## [1.0.1] - 2020-04-29
### Fixed
- Some README.md path fixes

## [1.0.0] - 2020-04-29
### Added
- APICreate
- ListenerCreated
- ModelClient
- ClientModelIndexes
- clientFunctions