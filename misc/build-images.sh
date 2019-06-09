#!/usr/bin/env bash
set -e

version=$(git describe --exact 2>/dev/null || git rev-parse --short=10 HEAD)

for service in registry storage web; do
  tag=entropicdev/$service:$version
  docker build -t $tag -f services/Dockerfile --build-arg SERVICE=$service services
  docker push $tag
  # If we're on a git tag, also push a `latest` so folks can pull
  # without specifying a docker tag
  if [[ $(git describe --exact 2>/dev/null) ]]; then
    latest_tag=entropicdev/$service:latest
    docker tag $tag $latest_tag
    docker push $latest_tag
  fi
done
