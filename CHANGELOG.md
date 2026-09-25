# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Common Changelog](https://common-changelog.org/).
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Default TOTP to SHA-1 and wait for the next time step instead of a fixed 31 seconds
- Honor `expires_in` in the API token cache
- Require Node.js 22, matching `.nvmrc`
- Run API smoke tests once in CI instead of once per browser
- Publish Playwright's GitHub reporter annotations on CI

## [0.1.0]

### Added

- Initial Playwright and TypeScript QA archetype
