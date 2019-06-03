#!/usr/bin/env bash
set -e

# Make sure docker-compose is installed
if ! hash docker-compose 2>/dev/null; then
  echo -e '\033[0;31mplease install docker\033[0m'
  exit 1
fi

if [ -z "$(docker network ls -qf name=^entropic$)" ]; then
  echo "Creating network"
  docker network create entropic >/dev/null
fi

COMPOSE_HTTP_TIMEOUT=120 docker-compose up --force-recreate

trap "exit" INT TERM
trap "kill 0" EXIT
