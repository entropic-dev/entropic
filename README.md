# Entropic: a federated package registry for anything

[![All Contributors](https://img.shields.io/badge/all_contributors-23-orange.svg?style=flat-square)](#contributors) [![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg?style=flat-square)](./.github/CODE_OF_CONDUCT.md)

A new package registry with a new CLI, designed to be easy to stand up inside your network. Entropic features an entirely new file-centric API and a content-addressable storage system that attempts to minimize the amount of data you must retrieve over a network. This file-centric approach also applies to the publication API. See the [API section of the manifesto](https://github.com/entropic-dev/entropic/tree/master/docs#apis) for more details about the API offered.

Entropic assumes many registries co-existing and interoperating as a part of your normal workflow. All Entropic packages are namespaced, and a full Entropic package spec also includes the hostname of its registry.

The legacy node package manager is treated as a read-only archive. You may install legacy packages through your Entropic home instance.

See [docs/README.md](docs/README.md) for the manifesto.

Are you interested in contributing? Do you have some feedback to share? Come talk with us in our [Discourse](https://discourse.entropic.dev/).

## What's working

Entropic is self-hosting. That means login, publication, and installation (mostly) are working. There are bugs, many unimplemented features, and the whole thing will probably fall over in a stiff breeze. We feel this is exceeding expectations for a project that's just over a month old.

Our development instance is running at `https://registry.entropic.dev/`. You'll probably all knock it over trying it out, I just know it.

## Overview

Package specifications are fully qualified with the namespace, hostname, and package name. They look like this: `namespace@example.com/pkg-name`. For example, the ds cli is specified by `chris@entropic.dev/ds`.

If you publish a package to your local registry that depends on packages from other registries, your local instance will proactively mirror all the packages yours depends on. The goal is to keep each instance entirely self-sufficient, so installs don't have to depend on a resource that might vanish. This is also true of packages installed from the legacy node package manager: they're given the namespace `legacy` and mirrored.

Abandoned packages are moved to the `abandonware` namespace.

Every Entropic user has a namespace that matches their user name. They may additionally belong to other namespaces. Packages can be updated by any user in the package's namespace. Packages can also have a list of maintainers.

For example, user `chris` owns the package `chris@entropic.dev/ds`. Chris can invite `ceejbot` to maintain `ds`. If ceejbot accepts, they'll be able to publish new versions of `ds`. Meanwhile, the package `lodash-people@entropic.dev/lodash` can be maintained by anybody who's a member of the `lodash-people` namespace. This might include the user `jdalton` and anybody else jdalton invites. (We hear that jdd gets a dollar every time somebody uses lodash as an example.)

All packages published to Entropic are public. Our expectation is that you'll use something like the [GitHub Package Registry](https://help.github.com/en/articles/about-github-package-registry) if you need to control access to packages you publish. Or you might choose to run an Entropic instance and control access to it another way.

The only thing about Entropic that assumes you're managing javascript packages is the installer. We are open to adding other kinds of installers for other languages.

### The `ds` cli

See [INSTALLING](docs/installing/README.md) to install.

Log in to a registry: `ds login`. You will be prompted to authenticate using Github.

The `ds` cli is configured with an `.entropicrc` file in your home directory. This is a [TOML](https://github.com/toml-lang/toml) file. Use it to specify your preferred registry, as well as any other registries you use normally.

```toml
registry = "http://example.com"

[registries."https://entropic.dev"]
token = "a-valid-entropic-token"

[registries."http://example.com"]
token = "another-valid-entropic-token"
```

The cli doesn't have a very sensible shell for running commands yet, and it doesn't yet have working help. (Help for help welcomed!) You can see what commands are implemented by browsing [the command source folder](./cli/lib/commands). See the [cli readme](./cli/README.md) for more notes.

At present, if you want to install packages using `ds`, you can run `ds build` in a directory with a `Package.toml`. This will produce a `ds/node_modules` directory, which you can move into place by hand. This is a temporary situation!

### Packages

Packages are described by [TOML](https://github.com/toml-lang/toml) files giving metadata and listing dependencies.

Here's an example `Package.toml`:

```toml
name = "chris@entropic.dev/ds"
version = "0.0.0-beta"

[dependencies]
"@iarna/toml" = "^2.2.3"
"legacy@entropic.dev/figgy-pudding" = "^3.5.1"
[...]
```

Publish a new package-version with `ds publish`.

## Contributing

Entropic is, at the moment of this writing, the work of two people: [Chris Dickinson](https://github.com/chrisdickinson) and [C J Silverio](https://github.com/ceejbot). They are not sponsored by anybody nor do they represent anyone but themselves. Chris and Ceej are seeking additional contributors but wish to onboard newcomers slowly. The project is new enough that clear direction does not always exist in the code, so contributors will need to work closely with us.

For more, see [Contributing](./.github/CONTRIBUTING.md) and our [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

## Moderators

- **[ceejbot](https://github.com/ceejbot)**
- **[chrisdickinson](https://github.com/chrisdickinson)**
- **[toddself](https://github.com/toddself)**
- **[varjmes](https://github.com/varjmes)**
- **[aredridel](https://github.com/aredridel)**

## Contributors

<!-- markdownlint-disable MD033 -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://github.com/nschonni"><img src="https://avatars2.githubusercontent.com/u/1297909?v=4" width="100px;" alt="Nick Schonning"/><br /><sub><b>Nick Schonning</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=nschonni" title="Documentation">📖</a></td><td align="center"><a href="https://github.com/gribnoysup"><img src="https://avatars2.githubusercontent.com/u/5036933?v=4" width="100px;" alt="Sergey"/><br /><sub><b>Sergey</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=gribnoysup" title="Code">💻</a></td><td align="center"><a href="https://jmes.tech"><img src="https://avatars0.githubusercontent.com/u/542140?v=4" width="100px;" alt="James"/><br /><sub><b>James</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=varjmes" title="Documentation">📖</a> <a href="https://github.com/entropic-dev/entropic/commits?author=varjmes" title="Code">💻</a></td><td align="center"><a href="https://zacanger.com"><img src="https://avatars3.githubusercontent.com/u/12520493?v=4" width="100px;" alt="Zac Anger"/><br /><sub><b>Zac Anger</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=zacanger" title="Code">💻</a></td><td align="center"><a href="https://tck.io"><img src="https://avatars3.githubusercontent.com/u/193412?v=4" width="100px;" alt="Todd Kennedy"/><br /><sub><b>Todd Kennedy</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=toddself" title="Code">💻</a></td><td align="center"><a href="http://bytes.inso.cc/"><img src="https://avatars2.githubusercontent.com/u/36964?v=4" width="100px;" alt="Sébastien Cevey"/><br /><sub><b>Sébastien Cevey</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=theefer" title="Code">💻</a></td><td align="center"><a href="http://www.linkedin.com/in/niklabh"><img src="https://avatars2.githubusercontent.com/u/874046?v=4" width="100px;" alt="Nikhil Ranjan"/><br /><sub><b>Nikhil Ranjan</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=niklabh" title="Code">💻</a></td></tr><tr><td align="center"><a href="http://twitter.com/olingern"><img src="https://avatars1.githubusercontent.com/u/1470297?v=4" width="100px;" alt="Nick Olinger"/><br /><sub><b>Nick Olinger</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=olingern" title="Code">💻</a></td><td align="center"><a href="https://linkedin.com/in/jonathanfweiss"><img src="https://avatars2.githubusercontent.com/u/39352?v=4" width="100px;" alt="Jonathan Weiss"/><br /><sub><b>Jonathan Weiss</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=jonathanweiss" title="Code">💻</a></td><td align="center"><a href="http://nesbitt.io"><img src="https://avatars2.githubusercontent.com/u/1060?v=4" width="100px;" alt="Andrew Nesbitt"/><br /><sub><b>Andrew Nesbitt</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=andrew" title="Documentation">📖</a></td><td align="center"><a href="http://brennx0r.com"><img src="https://avatars0.githubusercontent.com/u/3596466?v=4" width="100px;" alt="Brenna Flood"/><br /><sub><b>Brenna Flood</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=brennx0r" title="Documentation">📖</a></td><td align="center"><a href="https://aaronross.tech"><img src="https://avatars1.githubusercontent.com/u/18172185?v=4" width="100px;" alt="Aaron Ross"/><br /><sub><b>Aaron Ross</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=superhawk610" title="Documentation">📖</a> <a href="https://github.com/entropic-dev/entropic/commits?author=superhawk610" title="Code">💻</a></td><td align="center"><a href="http://ceejbot.github.io/"><img src="https://avatars3.githubusercontent.com/u/757502?v=4" width="100px;" alt="C J Silverio"/><br /><sub><b>C J Silverio</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=ceejbot" title="Code">💻</a> <a href="https://github.com/entropic-dev/entropic/commits?author=ceejbot" title="Documentation">📖</a></td><td align="center"><a href="https://www.neversaw.us"><img src="https://avatars3.githubusercontent.com/u/37303?v=4" width="100px;" alt="Chris Dickinson"/><br /><sub><b>Chris Dickinson</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=chrisdickinson" title="Code">💻</a> <a href="https://github.com/entropic-dev/entropic/commits?author=chrisdickinson" title="Documentation">📖</a></td></tr><tr><td align="center"><a href="http://dinhe.net/~aredridel/"><img src="https://avatars3.githubusercontent.com/u/2876?v=4" width="100px;" alt="Aria Stewart"/><br /><sub><b>Aria Stewart</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=aredridel" title="Code">💻</a></td><td align="center"><a href="https://pranshuchittora.github.io"><img src="https://avatars2.githubusercontent.com/u/32242596?v=4" width="100px;" alt="Pranshu Chittora"/><br /><sub><b>Pranshu Chittora</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=pranshuchittora" title="Documentation">📖</a></td><td align="center"><a href="http://katebeard.co"><img src="https://avatars2.githubusercontent.com/u/37520401?v=4" width="100px;" alt="Kate Beard"/><br /><sub><b>Kate Beard</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=sbinlondon" title="Documentation">📖</a></td><td align="center"><a href="http://zeke.sikelianos.com"><img src="https://avatars1.githubusercontent.com/u/2289?v=4" width="100px;" alt="Zeke Sikelianos"/><br /><sub><b>Zeke Sikelianos</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=zeke" title="Code">💻</a></td><td align="center"><a href="https://github.com/samccone"><img src="https://avatars3.githubusercontent.com/u/883126?v=4" width="100px;" alt="Sam Saccone"/><br /><sub><b>Sam Saccone</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=samccone" title="Documentation">📖</a></td><td align="center"><a href="http://m-mooga.com"><img src="https://avatars1.githubusercontent.com/u/2805614?v=4" width="100px;" alt="Mohamed Badawi"/><br /><sub><b>Mohamed Badawi</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=moogacs" title="Code">💻</a></td><td align="center"><a href="http://1stvamp.org/"><img src="https://avatars2.githubusercontent.com/u/35831?v=4" width="100px;" alt="Wes Mason"/><br /><sub><b>Wes Mason</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=1stvamp" title="Code">💻</a></td></tr><tr><td align="center"><a href="https://github.com/mirandaio"><img src="https://avatars1.githubusercontent.com/u/1652699?v=4" width="100px;" alt="Alfredo Miranda"/><br /><sub><b>Alfredo Miranda</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=mirandaio" title="Code">💻</a></td><td align="center"><a href="http://mechanica.io/"><img src="https://avatars0.githubusercontent.com/u/1357357?v=4" width="100px;" alt="Kirill Enykeev"/><br /><sub><b>Kirill Enykeev</b></sub></a><br /><a href="https://github.com/entropic-dev/entropic/commits?author=enykeev" title="Code">💻</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- markdownlint enable MD033 -->

## LICENSE

This project is released under the [Apache 2.0 license](./LICENSE).
