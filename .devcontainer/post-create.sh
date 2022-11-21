#!/usr/bin/env bash

set -euo -pipefail

[ -n $REMOTE_CONTAINERS ] && script/bootstrap
