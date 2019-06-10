# Hacking

## Running Services

* [Get Docker](https://docs.docker.com/install/)
* [Get Docker Compose](https://docs.docker.com/compose/install/)
* [Get Node](https://nodejs.org/en/download/)

Once you have Node, Docker, and Docker Compose,
`cp services/registry/.env-example services/registry/.env`
(and make any adjustments you like), `npm i`, and `npm start` (or `docker-compose up`).

Then go to <http://localhost:3000>.

## Hooks

To run linting and formatting pre-commit, add a file in the project root called
`.opt-in` with the content `pre-commit`.
