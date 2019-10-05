# Manifest TOML format

A proposal for a more formal TOML definition for entropic

- Version: DRAFT
- Date: 06/06/2019
- Authors
  - Todd Kennedy <todd@selfassembled.org>

## Abstract

This document is meant to describe the package manifest format for Entropic,
a federated solution to package management. Entropic needs to have its own
manifest file due to conflicts arising from the namespacing entropic uses.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

## Copyright

This document is copyright by its individual contributors, and available for
re-use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Introduction

Entropic cannot share a manifest format with the traditional `package.json` format
associated with the ECMAScript ecosystem for a number of reasons:

1. Entropic is intended to allow for federated package management for more than just the ECMAScript ecosystem
1. The `package.json` name specifier does not allow for the namespacing that entropic provides
1. There are recognized deficiencies with using JSON as human-readable metadata format

The project has chosen to standardize on TOML as a format due to various short-comings in the JSON file specification, especially concerns around:

1. Lack of comments
1. Lack of multiline string support
1. Designed for ease of generation by machine, not by hand

## Filename

The filename of the manifest **MUST** be `[TK].toml` and it **MUST** live in
the root directory of the package's filesystem. The root of the package is defined
as the closest parent directory that contains the manifest file, starting with
the current directory.

<details>
<summary>If file name is case-sensitive</summary>
On case-insensitive filesystems, it **MAY** be presented as `[TK].toml` but care
should be taken to preserve case when possible.
</details>

## Format

The format of this file is **REQUIRED** to be in [TOML](https://github.com/toml-lang/toml)
version 0.5.0 or later as defined by the project.

### Top-Level Data

The manifest **MUST** contain the following top-level keys, in order to be published:

- `"name"` - the canonical name of the package, as a string, including its namespace. e.g. `"toddself@static-pkg.dev/package2toml"`
- `"version"` - a [SEMVER](https://semver.org/) designation conforming to version 2.0.0 of the semantic versioning specification. Due to how TOML parses numbers, this must be represented as a string. e.g. `"1.0.4"`

These keys are **NOT REQUIRED** be present when interacting with the CLI locally (e.g. installing dependencies).

The manifest **MAY** contain the following fields:

- `"entry"` - the filename and package-relative path, as a string, to the main entry point of the package. The root for the relative-path is the directory which contains the `[TK].toml` file. e.g `"./src/index.js"`.
- `"type"` - if set to `"module"` this will output a [`package.json` with this included](https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field). The use of this field will explain to the interpreter how it should handle`.js` files.
- `"license"` - a valid [SPDX license](https://spdx.org/licenses/) for your code. If a license is not provided then the code is considered to be `UNLICENSED`.
- `"description"` - a short description of your package
- `"homepage"` - a URL for your project's homepage
- `"author"` - who wrote this package. this is any valid email identifier, or an array of valid identifiers.
- `"repository"` - where does this code live
- `"directory"` - for monorepo development, where in the monorepo does this package live (see: [npm RFC 10](https://github.com/npm/rfcs/blob/latest/implemented/0010-monorepo-subdirectory-declaration.md))

These fields **MAY** or **MAY NOT** be validated by CLI tools or the server-side
software, depending on the implementation.

Software implementing the entropic federation protocols and `[TK].toml` handling **MAY** complain about any of these optional fields as missing (`license` being an obvious candidate).

### Subsections

The manifest file **MAY** contain zero or more subsections as defined below.

#### Dependency Lists

Dependencies lists contain all the resources that are required for this package, in various scenarios. Dependencies consist of a `key/value` pair where the `key` is a string that provides a unique name for the package in this project. This `key` can be either the qualified package name from the package's manifest, a short-hand legacy reference (a bare package name e.g. `lodash` will expand out to `legacy@<current registry>/lodash`) or an <a href="#alias">alias</a> for the package.

When the `key` value is the qualified package name (e.g. `toddself@static-pkg.dev/package2toml`), then the `value` **MAY** be either a semver range for the package or the <a href="#alias">alias</a> definition.

<a name="alias"></a>

##### Aliases

Aliases can be used to provide short-hand references to longer or unwieldy package names. The only requirement is that they are valid package names and be unique.

They should point to sub-objects which **MAY** contain the following two keys or **MAY** be the short-hand representation of this data. One of these options **MUST** be chosen:

- `"name"` - the fully-qualified name of the package from the registry
- `"version"` - the semver range of this package you require

Shorthand: `"name@version"`

The object **MAY** also contain:

- `"patch"` - a `key`/`value` pair that allows specific overrides in the dependencies of the dependency. e.g. if this package depends on `lodash`, you could specify that you want it to use `underscore` instead: `"patch": {"legacy@registry.entropic.dev/lodash": "toddself@static-pkg.dev/underscore"}`

This section could be used to also specify platform exclusion/inclusion for some dependencies. Some thought might be needed to figure out how to make this workable across the wide range of computer platforms that implementations might be written for.

Examples:

To specify a specific version:

```
"toddself@static-pkg.dev/package2toml" = "1.0.4"
```

To alias a package using short-hand syntax:

```
"package2toml": "toddself@static-pkg.dev/package2toml@^1.0.0"
```

To alias a package and specify a patch:

```toml
[dependencies.package2toml]
"name" = "toddself@static-pkg.dev/package2toml"
"version" = "^1.0.0"
[dependencies.package2toml.patch]
"legacy@registry.entropic.dev/lodash" = "toddself@static-pkg.dev/underscore@1.0.5"
```

#### Dependency Types

You **MAY** declare dependency types for:

- `[dependencies]` - these are the packages that are required to run this package. They will be installed automatically when this package is required by another package, or when you specifically install the dependencies for this package manually.
- `[devDependencies]` - these are packages that are required to develop this package. They will be installed only when you install the dependencies for this package manually. If a package depends on the current package, they will **NOT** be installed as part of that dependency graph.
- `[peerDependencies]` - these packages are required to run this package, however, they will not be installed and should be additionally depended on or installed by either the parent package or along side this package for development.
- `[optionalDependencies]` - these packages are not required to run this software, but may provide additional options or features in this package. They must be required or installed by the parent package or along side this package for development.

### Example [TK].toml

```toml
"name" = "todd@static-pkg.dev/package2toml"
"version" = "1.0.4"

[dependencies]
"legacy@registry.entropic.dev/minimist" = "^1.2.0"

[devDependencies]
"legacy@registry.entropic.dev/tape" = "*"
```

## Contributors

- Chris Dickinson [@chrisdickinson](https://github.com/chrisdickinson)
- CJ Silverio [@ceejbot](https://github.com/ceejbot)
- Kat Marchán [@zkat](https://github.com/zkat)
- Zac Anger [@zacanger](https://github.com/zacanger)
- Nick Olinger [@olingern](https://github.com/olingern)
- Elad Ben-Israel [@eladb](https://github.com/eladb)
- Nick Schonning [@nschonni](https://githuib.com/nschonni)
