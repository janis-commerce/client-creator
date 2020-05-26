# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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