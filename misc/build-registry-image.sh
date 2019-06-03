#!/usr/bin/env bash
set -e

version=$(git descibe --exact 2>/dev/null || git rev-parse --short=10 HEAD)
docker build -t entropic/registry:$version -f services/registry.dockerfile services
