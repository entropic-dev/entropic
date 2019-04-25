# A one pager on executable asset management

## Table of contents

- [Some background (star wars title scroll):](#some-background-star-wars-title-scroll)
- [The problem, for real:](#the-problem-for-real)
- [Assumptions / Decisions / The Chem in the Golem's Head](#assumptions--decisions--the-chem-in-the-golems-head)
- [Open Questions & Consequences](#open-questions--consequences)
- [Solutions](#solutions)
  - [Just Build the Damn Registry From Scratch Again](#just-build-the-damn-registry-from-scratch-again)
  - [Or, Start With Verdaccio](#or-start-with-verdaccio)
  - [A Moderately Content Addressible Take On The Situation, Publishes](#a-moderately-content-addressible-take-on-the-situation-publishes)
  - [A Really Content Addressible Take On The Situation, Publishes and Installs](#a-really-content-addressible-take-on-the-situation-publishes-and-installs)
  - [Just Build the Damn Registry From Scratch Again, But Differently This Time, and Also Write a CLI](#just-build-the-damn-registry-from-scratch-again-but-differently-this-time-and-also-write-a-cli)
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

- A read-only mirror of all JavaScript (TM) packages published to **VCPM**.
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
- INSTALLERS will be able to access VCPM packages through the registry.
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

# Open Questions & Consequences

- Do we split the website and registry components into two services and two
  URLs? One service running in two modes depending on incoming `Host` header?
  One service running at one URL?
- Do we support the legacy VCPM API? To what degree?
    - For installation? For publication? For ACL manipulation?
    - Notably: breaking with the VCPM API may make life better for ADMINISTRATORS in
      the short term at the expense of INSTALLERS and MAINTAINERS.
        - We'd need a new CLI.
    - If we're not supporting the legacy API, do we still want to store packuments,
      or should we break these down into "package version lists"?
        - How far do we break things down? Into exploded files in a content addressible fashion?
- What does it look like to sign up for the new registry?
    - There's a website flow, even from the CLI (github oauth?)
    - Prove that you own a VCPM account by publishing a placeholder package containing
      `<nonce>` or something like that?
    - Provides the ability to mint new authentication tokens used by MAINTAINERS during
      publishes.
        - Can we version the tokens in token -- `ent_v1_<uuid>`, say? Make 'em obviously
          _not_ some other registry's brand of token?
- Federation. What does it look like?
- [Import maps][import-maps] are a going concern, as is tink.
    - Tink won't be ready by June 1st, _but_
    - Deno is also playing with this install-on-demand / CLI-less installer concept
    - This seems like a beneficial trend: then you just have to write a client for publishing
- Which semver standard to use?
- Do we want to let MAINTAINERS change package ACLs via the website?

# Solutions

## Just Build the Damn Registry From Scratch Again

- Keep the same API (so yarn and npm still work) but reimplement the services.
    - We can tweak the rules and backing implementation details as we choose, though
    - One bonus is that milestones are natural. E.g., you can login using `npm login`,
      you can `npm install` a whole dep graph from it.
- Downside is that we're tied to legacy decisions about the API structure that have
  knock-on effects when it comes to implementation detail and bandwidth/storage/upload costs.

## Or, Start With Verdaccio

- Why not? They've got a start at a solution.
- Does it save us time, attention, or the need to produce support docs?

## A Moderately Content Addressible Take On The Situation, Publishes

- Publish using Git, install using npm/yarn
- This is probably a bad idea, on its own. The goal here would be to sidestep 2 things:
    1. Writing (and supporting) our own CLI.
    2. Supporting the base64'd tarball JSON of the legacy publish API.

## A Really Content Addressible Take On The Situation, Publishes and Installs

- Publish using Git/$newcli, install using tink/deno/$NEWCLI
- Target the future!
- Downside: it's a lot to do, and if we're leaning on Tink we already know we might slip.

## Just Build the Damn Registry From Scratch Again, But Differently This Time, and Also Write a CLI

- Lots of green field here. This is both a good and a bad thing (Decisions take
  time. Making wise decisions takes even more time. We are time-limited.)
- Target the future!

[import-maps]: https://github.com/WICG/import-maps
