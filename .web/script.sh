#!/bin/sh

set -e

if [ -d "${HOME}/.dots" ]; then
	exit 0
fi

GUM_BIN="$(command -v gum || echo '')"

if [ -z "${GUM_BIN}" ]; then
	GUM_TMP="$(mktemp -d)"
	GUM_BIN="${GUM_TMP}/gum"

	curl -fsSL "https://bina.egoist.dev/charmbracelet/gum?dir=${GUM_TMP}" | sh
fi

passphrase="${DOTFILES_PASSPHRASE}"
personal="${PERSONAL_MACHINE}"

if [ -z "${passphrase}" ]; then
	passphrase="$(${GUM_BIN} input --password --placeholder 'dotfiles passphrase?')"
fi

if [ -z "${personal}" ]; then
	personal="$(${GUM_BIN} confirm 'personal machine?' --default='Yes' && echo 'true' || echo 'false')"
fi

git clone --depth=1 https://github.com/andrewbrey/dotfiles.git "${HOME}/dotfiles"

DOTFILES_PASSPHRASE="${passphrase}" PERSONAL_MACHINE="${personal}" "${HOME}/dotfiles/script/bootstrap"

rm -rf "${HOME}/dotfiles"
