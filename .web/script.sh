#!/bin/sh

set -e

if [ -d "${HOME}/.dots" ]; then
	exit 0
fi

passphrase="${DOTFILES_PASSPHRASE}"
personal="${PERSONAL_MACHINE}"

if [ -z "${passphrase}" ]; then
	read -p "dotfiles passphrase? " passphrase
fi

if [ -z "${personal}" ]; then
	read -p "personal machine (y/n)? " personal_response

	if [ "${personal_response}" = "y" ]; then
		personal='true'
	else
		personal='false'
	fi
fi

git clone --depth=1 https://github.com/andrewbrey/dotfiles.git "${HOME}/dotfiles"

DOTFILES_PASSPHRASE="${passphrase}" PERSONAL_MACHINE="${personal}" "${HOME}/dotfiles/script/bootstrap"

rm -rf "${HOME}/dotfiles"
