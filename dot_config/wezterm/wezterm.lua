local wezterm = require("wezterm")
local config = {}

wezterm.on('gui-startup', function(cmd)
  local tab, pane, window = wezterm.mux.spawn_window(cmd or {})
  window:gui_window():maximize()
end)

config.font = wezterm.font_with_fallback {
  'CaskaydiaMono NF',
}
config.color_scheme = "Arthur"
config.default_cursor_style = 'SteadyBar'
config.window_background_image = wezterm.config_dir .. "/assets/waves.gif"
config.window_background_opacity = 1.0
config.window_background_image_hsb = {
	brightness = 0.05,
	hue = 1.0,
	saturation = 1.0,
}
config.window_decorations = "RESIZE"
config.hide_tab_bar_if_only_one_tab = true

return config
