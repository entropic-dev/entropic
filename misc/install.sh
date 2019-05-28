#!/bin/bash

set -e
cd /tmp
curl -SsL https://www.entropic.dev/ds-latest.tgz -o ds-latest.tgz
npm install -g ds-latest.tgz
