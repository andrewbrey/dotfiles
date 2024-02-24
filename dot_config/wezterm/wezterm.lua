local wezterm = require("wezterm")
local config = {}

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
