#!/usr/bin/env bash

set -eo pipefail

if [ -n "${REMOTE_CONTAINERS}" ]; then
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

	secrets_file="${HOME}/.dots/.secrets"
	if [ -f "${secrets_file}" ]; then
		source "${secrets_file}" && use_gh
	fi

	#
	# install devcontainer app group
	export PATH="${HOME}/.deno/bin:$PATH"
	"${workspace_root}/script/lib/apps/_cli/cli.ts" install --skip-confirm --allow-reinstall -g devcontainer

	unset this_dir
	unset workspace_root
	unset secrets_file
fi
