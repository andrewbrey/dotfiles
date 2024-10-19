local wezterm = require("wezterm")
local act = wezterm.action
local config = {}

wezterm.on('gui-startup', function(cmd)
    local tab, pane, window = wezterm.mux.spawn_window(cmd or {})
    window:gui_window():maximize()
end)

config.mouse_bindings = {
    -- Change the default click behavior so that it only selects text and does
    -- not open hyperlinks --------------------------------------------------
    {
        event = {Up = {streak = 1, button = 'Left'}},
        mods = 'NONE',
        action = act.CompleteSelection 'ClipboardAndPrimarySelection'
    },

    -- Bind 'Up' event of CTRL-Click to open hyperlinks ---------------------
    {
        event = {Up = {streak = 1, button = 'Left'}},
        mods = 'CTRL',
        action = act.OpenLinkAtMouseCursor
    },

    -- Disable the 'Down' event of CTRL-Click to avoid weird program behaviors
    {
        event = {Down = {streak = 1, button = 'Left'}},
        mods = 'CTRL',
        action = act.Nop
    }
}

config.font = wezterm.font_with_fallback {'CaskaydiaMono NF'}
config.color_scheme = "Arthur"
config.default_cursor_style = 'SteadyBar'
config.window_background_image = wezterm.config_dir .. "/assets/waves.gif"
config.window_background_opacity = 1.0
config.window_background_image_hsb = {
    brightness = 0.05,
    hue = 1.0,
    saturation = 1.0
}
config.window_decorations = "RESIZE"
config.hide_tab_bar_if_only_one_tab = true

return config
