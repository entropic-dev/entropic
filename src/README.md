# entropic src

This is a monomicrorepo. All deps for subprojects are requested here.

You will need to copy `.env-example` into `.env` and edit to taste.

## whitelisting

You may optionally whitelist legacy packages allowed to be installed through entropic. To enable this feature, set the `WHITELIST` env var to point to a text file. Name allowed packages one per line.
