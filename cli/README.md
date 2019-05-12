# ds

The change in entropy is equal to the heat transfer divided by the temperature. `∂S = ∂Q/T`

## Configuration

`ds` reads its config from a [toml](https://github.com/toml-lang/toml) file in `~/.entropicrc`. The format looks like this:

```toml
registry="https://entropic.dev"

[registries."https://entropic.dev"]
token="my-auth-token here"

[registries."https://registry.example.com"]
token="my-example.com-auth-token here"
```

## Commands

Implement new commands as files in `lib/commands/`. Commands implemented as of this start at documentation:

* __login__: log into the selected registry, generating and storing an auth token
* __whoami__: respond with the name of the authenticated user
* __publish__: publish a new package-version, creating a package as a side effect if necessary
* __download__: fetch & insert into cache the content blobs for the named package-version

Commands that should exist:

* __help__: usage help
* __create__: create a new package, meta-info only
* __about__: or 'info' or 'view'; describe a package
* __install__: probably this would be handy
