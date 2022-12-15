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

	token=''
	secrets_file="${HOME}/.dots/.secrets"
	if [ -f "${secrets_file}" ]; then
		token=$(source "${secrets_file}" && use_gh && echo "${GH_TOKEN}")
	fi

	#
	# install devcontainer app group
	PATH="${HOME}/.deno/bin:$PATH" GH_TOKEN="${token}" "${workspace_root}/script/lib/apps/_cli/cli.ts" install --skip-confirm --allow-reinstall -g devcontainer

	unset this_dir
	unset workspace_root
	unset token
	unset secrets_file
fi
