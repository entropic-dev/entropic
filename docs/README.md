# A one pager on executable asset management

## Table of contents

- [Some background (star wars title scroll):](#some-background-star-wars-title-scroll)
- [The problem, for real:](#the-problem-for-real)
- [Assumptions / Decisions / The Chem in the Golem's Head](#assumptions--decisions--the-chem-in-the-golems-head)
- [Open Questions & Consequences](#open-questions--consequences)
- [Strategies](#strategies)
  - [:x: Just Build the Damn Registry From Scratch Again](#just-build-the-damn-registry-from-scratch-again)
  - [:x: Or, Start With Verdaccio](#or-start-with-verdaccio)
  - [:x: A Moderately Content Addressable Take On The Situation, Publishes](#a-moderately-content-addressable-take-on-the-situation-publishes)
  - [:white_check_mark: Just Build the Damn Registry From Scratch Again, But Differently This Time, and Also Write a CLI](#just-build-the-damn-registry-from-scratch-again-but-differently-this-time-and-also-write-a-cli)
    - [:white_check_mark: A Really Content Addressable Take On The Situation, Publishes and Installs](#a-really-content-addressable-take-on-the-situation-publishes-and-installs)
- [Proposed Solution](#proposed-solution)
  - [Objects](#objects)
    - [Packages](#packages)
    - [PackageVersion](#packageversion)
    - [PackageDistTag](#packagedisttag)
    - [PackageMaintainer](#packagemaintainer)
  - [Actions](#actions)
    - [Install a package](#install-a-package)
    - [Publish a new package](#publish-a-new-package)
    - [Publish a new version of a package](#publish-a-new-version-of-a-package)
    - [Yank a version of a package](#yank-a-version-of-a-package)
    - [Yank an entire package](#yank-an-entire-package)
    - [Invite users to become maintainers of a package](#invite-users-to-become-maintainers-of-a-package)
    - [Add or remove dist-tags of a package](#add-or-remove-dist-tags-of-a-package)
    - [Login to an existing account](#login-to-an-existing-account)
    - [Sign up for an account](#sign-up-for-an-account)
    - [Import account access from VCPM](#import-account-access-from-vcpm)
  - [APIs](#apis)

## Some background (star wars title scroll):

People love downloading JavaScript (TM) packages. JavaScript (TM) packages depend
on many other JavaScript (TM) packages, forming a dependency graph. People want
to find JavaScript (TM) packages using a centralized store, download an entire
dependency graph, and then unpack those packages on disk, on demand, in such a
way that popular JavaScript (TM) runtimes like Node.JS (TM) can execute them. We
will call this group of people **"INSTALLERS."**

Some subset of people enjoy this experience so much that they may feel
compelled to write new JavaScript (TM) packages and publish them for others to
find. They will want to manage publish access to these packages, distributing
the responsibility amongst their team. They want to provide identity assurances
about these packages: they want to be able to enable two factor auth, require
two factor auth to publish packages, and sign relevant metadata and file
content. We will call this group of people **"MAINTAINERS."** Some maintainers may
be evil: we will call these maintainers **"SPAMMERS."**

Complicating matters: we live in a flawed, capitalist society, so a smaller-yet
subset of people will be responsible for maintaining a registry and will be
liable for paying the bills. We will call this (un-?)happy group of people
**"ADMINISTRATORS."** This group may be further subdivided into administrators
primarily concerned with supporting the registry: identifying and removing spam
and spammers, resolving disputes, and ensuring the health of the community by
answering questions and responding to abuse reports. We will call this subset
of administrators **"SUPPORT."**

## The problem, for real:

**INSTALLERS** and **MAINTAINERS** are presently using a VC-backed public
registry (hence, "**VCPM**") as a public good. However, VC funding may run out
someday and in any case has untowards effects on such a registry. **CALAMITY**
is on the horizon.

**INSTALLERS** and **MAINTAINERS**, presently, are happy with the tools they
have to interact with the registry. They do not want to respond to the
**CALAMITY**. They are reluctant to move to another registry. A new registry would
have to, at minimum, provide the following:

- A read-only mirror of JavaScript (TM) packages published to **VCPM**, delivered
  on demand.
- Critical mass of **INSTALLERS** and **MAINTAINERS** moving to the new registry.
- Support structure for any new tooling **INSTALLERS** or **MAINTAINERS** must
  use (documentation, blog posts, reassurances that the new registry won't turn
  into a werewolf).

**MAINTAINERS** may be further swayed by the following features:

- The ability to "import" their **VCPM** profile and its package access from
  **VCPM**.
- An open source registry, capable of federation.

**ADMINISTRATORS** are on the hook for paying for a new registry and supporting
it. By far the cheapest option is to throw a party to which no one shows up.
That is a failure case, however, especially in the light of the **CALAMITY**.
**ADMINISTRATORS** have limited resources: time, money, and attention.

The goal of administrators, then, is to build a solution that strikes a balance
between **ADMINISTRATORS**, **MAINTAINERS**, and **INSTALLERS**. The solution
must be compelling enough to convince **INSTALLERS** and **MAINTAINERS** to
take part in the new registry, thus avoiding **CALAMITY**, without overdrawing
on the resources of administrators.

# Assumptions / Decisions / The Chem in the Golem's Head

- Do the simplest thing that works, then iterate on that as it breaks.
- We will build a new registry and website.
- INSTALLERS will be able to access VCPM packages through the registry, on demand.
  - Note: this implies we will mirror on-demand, not optimistically.
  - This means we'll defer (or eliminate) the cost of supporting the long tail of
    VCPM packages.
- INSTALLERS will not be subject to package privacy rules via access control lists.
- MAINTAINERS will be subject to package access lists (who can publish which package?)
- INSTALLERS may browse the registry via a website.
- MAINTAINERS may create an account via the website.
- Leave Stars out. :star2:
- We want to demo _something_ by June 1st at JSConf EU.
  - Marketing can help nudge INSTALLERS and MAINTAINERS to move, avoiding CALAMITY.
  - It can also help some INSTALLERS and MAINTAINERS become ADMINISTRATORS, increasing
    our reserves of attention.
- It is easy to put behind a CDN.
- All packages are public.
- All packages are namespaced by the originally-publishing entity.
- Yes semver required. (discuss which standard)
- We don't explicitly wish to make this API line up with other package manager APIs.
  - Crates, VCPM, etc.
- MAINTAINERS use authentication tokens for publishing. Version tokens in an
  obvious fashion: `ent_v1_<uuid>`, say.
  - This makes it obvious that they don't belong to any other registry.
- IMPLEMENTATION: (NOTE_SERVICES)
  - Plan is: 3 services: registry, website, internal.
  - Start with the registry.
    - Plan to split out internal from the registry.
  - Splitting www from the registry makes security easier, and gives us much more room
    to manuever with regards to the legacy VCPM API.

# Open Questions & Consequences

- ~Do we split the website and registry components into two services and two
  URLs? One service running in two modes depending on incoming `Host` header?
  One service running at one URL?~ See "NOTE_SERVICES" above.
- Do we support the legacy VCPM API? To what degree?
  - For installation? For publication? For ACL manipulation?
  - Notably: breaking with the VCPM API may make life better for ADMINISTRATORS in
    the short term at the expense of INSTALLERS and MAINTAINERS.
    - We'd need a new CLI.
  - If we're not supporting the legacy API, do we still want to store packuments,
    or should we break these down into "package version lists"?
    - How far do we break things down? Into exploded files in a content addressable fashion?
- What does it look like to sign up for the new registry?
  - There's a website flow, even from the CLI (github oauth?)
  - Prove that you own a VCPM account by publishing a placeholder package containing
    `<nonce>` or something like that?
  - Provides the ability to mint new authentication tokens used by MAINTAINERS during
    publishes.
- Federation. What does it look like?
- [Import maps][import-maps] are a going concern, as is tink.
  - Tink won't be ready by June 1st, _but_
  - Deno is also playing with this install-on-demand / CLI-less installer concept
  - This seems like a beneficial trend: then you just have to write a client for publishing
- Which semver standard to use?
- Do we want to let MAINTAINERS change package ACLs via the website?

# Strategies

## Just Build the Damn Registry From Scratch Again

- Keep the same API (so yarn and npm still work) but reimplement the services.
  - We can tweak the rules and backing implementation details as we choose, though
  - One bonus is that milestones are natural. E.g., you can login using `npm login`,
    you can `npm install` a whole dep graph from it.
- Downside is that we're tied to legacy decisions about the API structure that have
  knock-on effects when it comes to implementation detail and bandwidth/storage/upload costs.
- **We don't want to do this.** These legacy decisions box us in and precipitate future **CALAMITY**.

## Or, Start With Verdaccio

- Why not? They've got a start at a solution.
- Does it save us time, attention, or the need to produce support docs?
- **We don't want to do this.** For similar reasons as above.

## A Moderately Content Addressable Take On The Situation, Publishes

- Publish using Git, install using npm/yarn
- This is probably a bad idea, on its own. The goal here would be to sidestep 2 things:
    1. Writing (and supporting) our own CLI.
    2. Supporting the base64'd tarball JSON of the legacy publish API.
- **We don't want to do this**: while we've alleviated the publish side of the problem, the legacy package
  installation API still boxes us in.

## Just Build the Damn Registry From Scratch Again, But Differently This Time, and Also Write a CLI

- Lots of green field here. This is both a good and a bad thing (Decisions take
  time. Making wise decisions takes even more time. We are time-limited).
- Target the future!

### A Really Content Addressable Take On The Situation, Publishes and Installs

- Publish using Git/$newcli, install using tink/deno/$NEWCLI
- Target the future!
- Downside: it's a lot to do, and if we're leaning on Tink we already know we might slip.
- **This is still an option.** It's really just an implementation detail of the above.

# Proposed Solution

## Objects

### IntegrityString

A [subresource-integrity](https://mdn.io/subresource-integrity) string.

```
"sha512-S2XAR1R0DqkECH3W+lI6zP/HWsbvrxSt7gCPjfQXX7SvG5vANp3CfOFjmtn7NGV7Km7zY1pRzCLcHis/wBNKdw=="
```

* * *

### VersionsIntegrity

```javascript
{
  "<version>": IntegrityString,
  "<version>": IntegrityString,
  ...
}
```

E.g.: `{"1.0.0":
"sha512-S2XAR1R0DqkECH3W+lI6zP/HWsbvrxSt7gCPjfQXX7SvG5vANp3CfOFjmtn7NGV7Km7zY1pRzCLcHis/wBNKdw=="}`.

A mapping of versions to subresource-integrity hashes of
[`PackageVersion`](#package-version) contents.

* * *

### Tags

```javascript
{
  "latest": String,
  "<tag spec>": String,
  ...
}
```

A mapping of tags to versions. `"latest"` will always point to the most
recently published (un-yanked) version. If there are no un-yanked versions (or
no versions, in the case of a brand-new package), this object will be
**empty**.

* * *

### Package

```javascript
{
  name: String, // "{namespace}/{package name}"; e.g. "chrisdickinson/buffer"
  yanked: Boolean,
  require_tfa: Boolean,
  versions: VersionsIntegrity,
  tags: Tags,
  created: Date,
  modified: Date
}
```

* * *

### PackageVersion

```javascript
{
  yanked: Boolean,
  files: FilesIntegrity,
  derivedFiles: FilesIntegrity,
  dependencies: Dependencies,
  devDependencies: Dependencies,
  peerDependencies: Dependencies,
  optionalDependencies: Dependencies,
  bundledDependencies: Dependencies,
  signatures: [String, String, ...],
  created: Date,
  modified: Date
}
```

* * *

### PackageDistTag

* * *

### PackageMaintainer

* * *

## Actions

### Install a package

![installation](/docs/assets/install.png)

Installation of a package can happen in a couple of different ways:

- A fresh install or tagged install (`npm i foo`, `npm i foo@beta`).
- An install of a specific version (`npm i foo@1.0.0`).

The flow for syncing a dependency tree to local cache:

1. For a given package USER/PACKAGE P, CONSTRAINT C, and MODE M:
    1. Request P from the local cache BY NAME. If the entry is less than 5 minutes old, do not attempt to revalidate.
        1. If the package is missing, or if it needs revalidated, request P from the registry at `/packages/package/USER/PACKAGE`.
            1. If the package could not be found, fail with NOTFOUND.
    2. Create a version array called "RESOLVED".
    3. For each key and value (V and I) in the `P.versions` object:
        1. If V does not match constraint C, ignore and continue to the next version.
        2. For each hash H in I, interpreted as a subresource integrity string:
            1. Check to see if H exists in local cache. If it exists:
                1. Store object from local cache in RESOLVED, and as "O".
            2. If it does not exist:
                1. Fetch the version from the registry at `/packages/package/USER/PACKAGE/versions/V`.
                2. Store object as "O".
                3. Create a subresource integrity string for O, and store in cache.
                4. Store object in RESOLVED.
            3. For each key and value (F and I) in the `O.files` object:
                1. For each algo A, hash H in I, interpreted as a subresource integrity string:
                    1. Check to see if H exists in local cache.
                    2. If it does not exist:
                        1. Fetch the object from one of the available mirrors using `/objects/object/A/H`.
                        2. Store it in cache.
            4. For each key and value (D and R) in the `O.dependencies` object:
                2. Recurse to 1 with D and R. Propagate failure upward.
            5. If if the "dev" flag is set in M, for each key and value (D and R) in `O.devDependencies` object:
                2. Recurse to 1 with D and R. Propagate failure upward.
            6. For each key and value (D and R) in the `O.peerDependencies` object:
                2. Recurse to 1 with D and R. Propagate failure upward.
            7. For each key and value (D and R) in the `O.optionalDependencies` object:
                2. Recurse to 1 with D and R. Ignore failure.
    4. If RESOLVED length is 0, fail with UNRESOLVABLERANGE.
    5. Return success with RESOLVED.

* * *

### Publish a new package

* * *

### Publish a new version of a package

* * *

### Yank a version of a package

* * *

### Yank an entire package

* * *

### Invite users to become maintainers of a package

* * *

### Add or remove dist-tags of a package

* * *

### Login to an existing account

* * *

### Sign up for an account

* * *

### Import account access from VCPM

* * *

## APIs

New registry API Scheme:

```
GET     /packages
GET     /packages/authored-by/<namespace>
GET     /packages/maintained-by/<namespace>

GET     /packages/package/<namespace>/<name>
PUT     /packages/package/<namespace>/<name>
DELETE  /packages/package/<namespace>/<name>                                # yank. still available, but not displayed anywhere. maintained only by "abandonware"

GET     /packages/package/<namespace>/<name>/dist-tags
PUT     /packages/package/<namespace>/<name>/dist-tags/latest               $DISALLOWED
DELETE  /packages/package/<namespace>/<name>/dist-tags/latest               $DISALLOWED
PUT     /packages/package/<namespace>/<name>/dist-tags/<tag>
DELETE  /packages/package/<namespace>/<name>/dist-tags/<tag>

GET     /packages/package/<namespace>/<name>/versions                       # version-list comes with hash of result of <files> call below
PUT     /packages/package/<namespace>/<name>/versions/<version>
DELETE  /packages/package/<namespace>/<name>/versions/<version>

GET     /packages/package/<namespace>/<name>/maintainers
POST    /packages/package/<namespace>/<name>/maintainers/<namespace>
DELETE  /packages/package/<namespace>/<name>/maintainers/<namespace>
POST    /packages/package/<namespace>/<name>/maintainers/<namespace>/<uuid> # accept invitation to join/leave
DELETE  /packages/package/<namespace>/<name>/maintainers/<namespace>/<uuid> # decline invitation to join/leave

GET     /packages/package/<namespace>/<name>/dependents
GET     /packages/package/<namespace>/<name>/dependents/range/<range>
GET     /packages/package/<namespace>/<name>/dependencies

GET     /packages/package/<namespace>/<name>/versions/<version>/readme

GET     /packages/package/<namespace>/<name>/versions/<version>/files
GET     /objects/object/<oid>

GET     /packages/search

POST    /auth/logout
POST    /auth/login
GET     /auth/login/ready
GET     /auth/whoami

GET     /changes
```

`scope` represents a user. Eventually we may allow teams to be created (for free).

We will reserve two scopes up-front: `legacy` and `abandonware`. `legacy` is
special-cased and reads through to the legacy VCPM API. When a package is
deleted by a user, access is transferred to `abandonware`.

New website scheme:

```
GET     /
GET     /login
POST    /login
GET     /login/-/from-cli/<uuid>                  # landing page for logging in from the cli
POST    /login/-/from-cli/<uuid>                  # landing page for logging in from the cli
GET     /login/-/from-github                      # oauth receiver for jthoobs
GET     /signup
POST    /signup
POST    /logout
GET     /settings/<namespace>
GET     /settings/<namespace>/import
POST    /settings/<namespace>/import
GET     /settings/<namespace>/password
POST    /settings/<namespace>/password
GET     /settings/<namespace>/email
POST    /settings/<namespace>/email
GET     /settings/<namespace>/tfa
POST    /settings/<namespace>/tfa
GET     /settings/<namespace>/tokens
POST    /settings/<namespace>/tokens
GET     /about
GET     /legal
GET     /support
GET     /sitemap
GET     /search
GET     /legacy
GET     /legacy/<legacy scope>/<legacy package>   # special casing this for the website: @smallwins/slack is available as /legacy/smallwins/slack
GET     /legacy/<legacy package>
GET     /<namespace>/<package>/accept/<uuid>      # accept invitation
POST    /<namespace>/<package>/accept/<uuid>
GET     /<namespace>/<package>
GET     /<namespace>                              # display all non-yanked packages that the user currently maintains.
```

Website uses cookie-based auth.

[import-maps]: https://github.com/WICG/import-maps
