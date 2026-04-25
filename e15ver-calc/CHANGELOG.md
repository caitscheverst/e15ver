# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (how hypocritical of me!)

## [Unreleased]

## [1.0.2] - 2026-04-25

### Added

- New formatComplexVersion(result) method added so users don't have to manually parse the complex vernum to use it elsewhere.

## [1.0.1] - 2026-04-25

### Fixed

- Fixed git log parsing to use simple-git's native object format instead of custom format strings
- Fixed TypeScript configuration for Node.js CLI compatibility
- Added proper Node.js type definitions to resolve `process` and `console` errors

### Changed

- Untagged repositories now start from v0.0.0 instead of synthesizing versions from commit count
- Updated tsconfig to use `moduleResolution: "nodenext"` for modern Node.js support
- CLI output now displays complex manifold coordinates alongside version numbers

### Added

- Published to npm with global CLI support (`npm install -g e15ver-calc`)
- Added `bin` configuration for command-line executable

## [1.0.0] - 2026-04-25

### Added

- Initial release of e15ver-calc reference implementation
- CLI tool for analyzing git repositories and calculating e15ver versions
- TypeScript library for programmatic access to e15ver calculations
- Support for repositories with git tags (uses most recent tag as reference)
- Support for untagged repositories (starts from v0.0.0)
- Comprehensive documentation and README
- Mathematical implementation of version manifold parametrization
- Git state parsing using simple-git
- Confidence scoring based on tag presence and repository state

[Unreleased]: https://github.com/caitscheverst/e15ver/compare/1.0.1...HEAD
[1.0.1]: https://github.com/caitscheverst/e15ver/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/caitscheverst/e15ver/releases/tag/1.0.0
