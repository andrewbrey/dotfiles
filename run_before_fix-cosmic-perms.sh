#!/usr/bin/env bash

# Fixes file permissions for COSMIC desktop settings/configs managed by chezmoi.
#
# COSMIC's settings daemon writes config files with a narrower permission mask
# (0644) than chezmoi's default (0664). This causes chezmoi to flag these files
# as changed before every apply, since it restores its own permissions each time.
#
# If you see `chezmoi status` or `chezmoi update` repeatedly complaining about
# mode changes (e.g. "old mode 100664 / new mode 100644") for files under
# ~/.config/cosmic/, add the relevant directory to the COSMIC_DIRS array below.

COSMIC_DIRS=(
	"$HOME/.config/cosmic/com.vintagetechie.CosmicExtAppletTempest/v1"
)

for dir in "${COSMIC_DIRS[@]}"; do
	if [ -d "$dir" ]; then
		chmod g+w "$dir"/*
	fi
done
