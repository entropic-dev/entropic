# Entropic: a federated package registry for anything

Goals:

- It is easy for anyone with access to a cloud provider or bare metal to set up.
- It is easy to put behind a CDN.
- It is a single monolithic service with a database backing it.
- It shares its index with other instances of Entropic.
- All packages are public.
- All packages are namespaced by the originally-publishing user.
- (discuss) It has accounts, but they are not standalone: one must log in with an oauth provider.
- It provides a RESTful API for clients.
- (discuss) It provides a read-through cache for npm packages.
- (discuss) It provides cryptographic signatures that can be verified for package-versions.
- All packages have append-only history logs.
- Yes semver required. (discuss which standard)
- It provides a website for browsing the registry in a read-only manner.

This design is aimed at *expedient replacement*  of an unreliable npm registry. It makes no attempt to solve installation speed problems through clever redesign of the backing data, though it should *support* those efforts once a simple implementation is working.

The goal is to have as many of these running as administrators wish: this is federated package management.

A full package specification is `example.com/username/packagename/v1.2.3`.


## Things you can do

- Create an account, using one of the supported primary oauth providers.
- Connect a new oauth account. (requires auth)
- Close an account, orphaning your packages. (auth)
- Create a package.  (auth)
- Upload a new package-version (meta-data & payload both immutable). (auth)
- Publish or update a readme for a package-version. (auth)
- Fetch package metadata.
- Fetch package-version metadata.
- Fetch a package-version readme.
- Fetch a package-version payload.
- Verify package-version signatures (payload & metadata).
- Mark a package-version deprecated. (auth)
- Update package metadata. (auth)
- Change package ownership. (auth)
- Add or remove package maintainer (auth; owner-only)
- Orphan a package. (Changes namespace, leaves a pointer.) (auth)
- View a package's history.
- View a user's profile: pointers to other accounts, package list, history of actions.
- Read through to the historic immutable data in the npm-registry

### Things an administrator can do:

- Remove a package, leaving a tombstone.
- Remove a user, leaving a tombstone.

##  The data

Major nouns: user, package, package-version, package-owner, package-maintainer, package-version-readme, package-version-metadata, package-version-payload, auth-token

### user

- name
- list of oauth accounts: github, gitlab, bitbucket, google. secondary providers: twitter, ?? (Secondary providers support social proofs but are not enough to create an account.)
- pgp public key or pointer to keybase account? (discuss; keybase website proof would be GREAT)
- has-many package-ownerships
- has-many package-maintainerships
- has-one append-only history log (textually-described actions? discuss)
- sure use gravatar, whatever
- has-many auth tokens

### package

- name
- owner (user)
- git repo pointer
- textual description (short; markdown)
- has-many maintainers (users); might be empty list
- has-many versions; might be empty list
- has append-only actions history log (textually-described actions? discuss)

Maintainers can add new package-versions & change package-version readmes.

### package-version

- semver tag
- cryptographic signatures/hashes for payload
- cryptographic signature for metadata
- package-version-metadata:
	- opaque blob, presumed json
	- immutable
	- hashed & signed
- package-version-payload:
	- opaque blob, presumed binary
	- immutable
	- hashed & signed
- package-version-readme
	- utf-8 text, markdown required
	- sanitized on the way in

What's in package-version metadata? Client-determined. *Everything required to install it.* First-level deps. Example would be the npm corgi json.

## The read-through cache

The following npm public registry data is cached:

- package metadata, full json (if-modified checked, probably with a throttle)
- package metadata, corgi json (if-modified checked, probably with a throttle)
- package tarballs, immutably

Only these three GETs from the historical npm api are supported. Metadata is rewritten on the way in to refer to local tarball urls.

## The public API

(discuss)

RESTful following a very predictable pattern.

## The private API

There is an out-of-band administrative account. This account can delete/ban/whatever users & packages.

## The clients

### cli

Big topic; needs its own document. Some sketchy notes follow.

- uses tokens to authenticate? authZ happens entirely on back end
- is responsible for building & signing metadata & payload blobs on publication
- uses metadata to install a package
- should never ask for immutable data more than once

### website

Offers account creation. Is the only place where account creation is possible.

OPTIONAL: Offers Keybase web site proofs. (Blob on the profile page. Blob must have a spam defense. Probably if is not valid pgp msg, boot it.)

### Search

Optional. (Make sure google juice is good.)

##  Implementation notes

The specification should be implementable on any language platform you care to use.

- a single monolithic service of some kind
- a postgres
- an object store (files or S3 should be possible, pluggable I guess)


## Anti-goals

- No stars/favorites.
- No attempt to reproduce apis from cargo or npm.
- No advanced things like watching a package or notifications.

## Problems we'll have to deal with

- Spam.


## Implementation plan

(discuss)

Get the read-through cache working & into production immediately. This should work with all existing npm clients. This will also sort out issues like object storage and CDNs.

Stand up some extremely simple website. Express with handlebars, for speed's sake.

Write a cli that can install via the read-through cache but using new endpoints.

Write account creation & login. This sorts out databases.

Write package creation/editing: this gets you a slice of back end apis, the auth for entropy, and working POSTs.

Write package-version publication: this is a major design step.
