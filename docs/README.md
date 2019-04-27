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
registry (hence, "**VCPM**") as a public good. However, VC funding is about to
run out and in any case has untowards effects on such a registry. **CALAMITY**
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
  into a werewolf.)

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

- Do the dumbest thing that works, then iterate on that as it breaks. KISS.
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
  time. Making wise decisions takes even more time. We are time-limited.)
- Target the future!

### A Really Content Addressable Take On The Situation, Publishes and Installs

- Publish using Git/$newcli, install using tink/deno/$NEWCLI
- Target the future!
- Downside: it's a lot to do, and if we're leaning on Tink we already know we might slip.
- **This is still an option.** It's really just an implementation detail of the above.

# Proposed Solution

## Objects

### Packages

* * *

### PackageVersion

* * *

### PackageDistTag

* * *

### PackageMaintainer

* * *

## Actions

### Install a package

![installation](/docs/assets/install.png)

Installation of a package can happen in a couple of different ways:

- a fresh install or tagged install (`npm i foo`, `npm i foo@beta`).
- an install of a specific version (`npm i foo@1.0.0`)

> #### Open questions
>
> **Why break out the installation flow into so many different requests? There's N+4 requests there!**
>
> To tackle the smaller bit of this first -- the 4 requests: the idea is to
> unbundle the packument metadata. We've noticed over time that including
> per-version metadata in a single packument tends to grow unbounded over time.
> This extra metadata incurs a cost on all other operations, whether or not those
> operations need that metadata at the moment.
>
> This install flow optimizes for skipping requests completely (vs. 301'ing them.)
>
> With regards to the larger bit of the question -- the N requests: that's a
> tough one. What I've described looks a lot like Git's original HTTP
> transport. You will be unsurprised to hear that [it was eventually superseded][git-smart].
> Git eventually got around the speed constraints of HTTP by saying
> "let's implement packfile negotiation over HTTP." You could do something
> similar here.
>
> **If version and tag lists are referred to by content address in the top level
> package, why not request them from the object store instead of a dedicated
> endpoint?**
>
> I waffle on this.
>
> In order to install specific versions it's handy to be able to shortcircuit
> by saying `GET /packages/package/CHRIS/FOO/versions/99.99.99/files`.

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
GET     /packages/authored-by/<scope>
GET     /packages/maintained-by/<scope>

GET     /packages/package/<scope>/<name>
GET     /packages/package/<scope>/<name>
DELETE  /packages/package/<scope>/<name>                            # yank. still available, but not displayed anywhere. maintained only by "abandonware"

GET     /packages/package/<scope>/<name>/dist-tags
PUT     /packages/package/<scope>/<name>/dist-tags/latest           $DISALLOWED
DELETE  /packages/package/<scope>/<name>/dist-tags/latest           $DISALLOWED
PUT     /packages/package/<scope>/<name>/dist-tags/<tag>
DELETE  /packages/package/<scope>/<name>/dist-tags/<tag>

GET     /packages/package/<scope>/<name>/versions                   # version-list comes with hash of result of <files> call below
PUT     /packages/package/<scope>/<name>/versions/<version>
DELETE  /packages/package/<scope>/<name>/versions/<version>

GET     /packages/package/<scope>/<name>/maintainers
POST    /packages/package/<scope>/<name>/maintainers/<scope>
DELETE  /packages/package/<scope>/<name>/maintainers/<scope>
POST    /packages/package/<scope>/<name>/maintainers/<scope>/<uuid> # accept invitation to join/leave
DELETE  /packages/package/<scope>/<name>/maintainers/<scope>/<uuid> # decline invitation to join/leave

GET     /packages/package/<scope>/<name>/dependents
GET     /packages/package/<scope>/<name>/dependents/range/<range>
GET     /packages/package/<scope>/<name>/dependencies

GET     /packages/package/<scope>/<name>/versions/<version>/readme

GET     /packages/package/<scope>/<name>/versions/<version>/files
GET     /objects/object/<oid>

GET     /packages/search

POST    /auth/logout
POST    /auth/login
GET     /auth/login/ready
GET     /auth/whoami

GET     /changes
```

`scope` represents a user. Eventually we may allow teams to be created (for free.)

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
GET     /settings/<scope>
GET     /settings/<scope>/import
POST    /settings/<scope>/import
GET     /settings/<scope>/password
POST    /settings/<scope>/password
GET     /settings/<scope>/email
POST    /settings/<scope>/email
GET     /settings/<scope>/tfa
POST    /settings/<scope>/tfa
GET     /settings/<scope>/tokens
POST    /settings/<scope>/tokens
GET     /about
GET     /legal
GET     /support
GET     /sitemap
GET     /search
GET     /legacy
GET     /legacy/<legacy scope>/<legacy package>   # special casing this for the website: @smallwins/slack is available as /legacy/smallwins/slack
GET     /legacy/<legacy package>
GET     /<scope>/<package>/accept/<uuid>          # accept invitation
POST    /<scope>/<package>/accept/<uuid>
GET     /<scope>/<package>
GET     /<scope>                                  # display all non-yanked packages that the user currently maintains.
```

Website uses cookie-based auth.

[import-maps]: https://github.com/WICG/import-maps
[git-smart]: http://scottchacon.com/2010/03/04/smart-http.html
