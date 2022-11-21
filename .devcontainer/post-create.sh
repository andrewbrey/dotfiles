#!/usr/bin/env bash

set -euo pipefail

if [ -n $REMOTE_CONTAINERS ]; then
	this_dir=$(cd -P -- "$(dirname -- "$(command -v -- "$0")")" && pwd -P)
	workspace_root=$(realpath ${this_dir}/..)

	# =====
	# all containerized environments
	# =====
	#
	# execute the bootstrap script just as happens
	# in GitHub Codespaces and Gitpod
	"${workspace_root}/script/bootstrap"

	# =====
	# devcontainer specific
	# =====
	#
	# perform additional setup that is unique to
	# this devcontainer, and which doesn't happen
	# in cloud editors

	#
	# install node and npm globals
	echo todo, install node and npm globals...

	unset this_dir
	unset workspace_root
fi
