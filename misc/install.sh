#!/bin/sh
set -e

cd /tmp

ENTROPIC_SRC="https://www.entropic.dev/ds-latest.tgz"

if type wget &>/dev/null; then
  curl -SsL $ENTROPIC_SRC -o ds-latest.tgz
elif type wget &>/dev/null; then
  curl $ENTROPIC_SRC -o ds-latest.tgz
else
  echo 'Please install curl or wget!'
  exit 1
fi

# engine-strict config forces checking against engines.node version constraint
NPM_CONFIG_ENGINE_STRICT=true npm install -g ds-latest.tgz
