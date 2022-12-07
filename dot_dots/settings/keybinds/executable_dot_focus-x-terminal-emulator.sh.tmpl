#!/usr/bin/env zsh

function focus_x_terminal_emulator() {
	local process_pid=$(ps -eo pid,comm | grep -v grep | grep x-terminal-emulator | head -n 1 | awk '{print $1}')

	if [ "${process_pid}" != '' ]; then
		local window_id=$(wmctrl -lp | grep "${process_pid}" | awk '{print $1}')

		wmctrl -via $window_id
	else
		x-terminal-emulator
	fi
}

focus_x_terminal_emulator
