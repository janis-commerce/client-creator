# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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