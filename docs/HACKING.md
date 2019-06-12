# Hacking

## Running Services

* [Get Docker](https://docs.docker.com/install/)
* [Get Docker Compose](https://docs.docker.com/compose/install/)
* [Get Node](https://nodejs.org/en/download/)

Once you have Node, Docker, and Docker Compose,
`cp services/registry/.env-example services/registry/.env`
`cp services/storage/.env-example services/storage/.env`
`cp services/web/.env-example services/web/.env`
and make any adjustments you like.

run `npm i` in services/registry/, services/storage/, services/web, services/workers
then `npm start` (or `docker-compose up`) in main directory

Then go to <http://localhost:3000>.

## Hooks

To run linting and formatting pre-commit, add a file in the project root called
`.opt-in` with the content `pre-commit`.

## Windows

If you're on Windows, your best bet is to use
[WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10).
