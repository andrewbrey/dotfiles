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

 config.keys = {
  -- Clears only the scrollback and leaves the viewport intact.
  -- You won't see a difference in what is on screen, you just won't
  -- be able to scroll back until you've output more stuff on screen.
  -- This is the default behavior.
  -- {
  --   key = 'K',
  --   mods = 'CTRL|SHIFT',
  --   action = act.ClearScrollback 'ScrollbackOnly',
  -- },
  -- Clears the scrollback and viewport leaving the prompt line the new first line.
  -- {
  --   key = 'K',
  --   mods = 'CTRL|SHIFT',
  --   action = act.ClearScrollback 'ScrollbackAndViewport',
  -- },
  -- Clears the scrollback and viewport, and then sends CTRL-L to ask the
  -- shell to redraw its prompt
  {
    key = 'K',
    mods = 'CTRL|SHIFT',
    action = act.Multiple {
      act.ClearScrollback 'ScrollbackAndViewport',
      act.SendKey { key = 'L', mods = 'CTRL' },
    },
  },
}

-- config.font = wezterm.font_with_fallback {'MesloLGLDZ Nerd Font Mono'}
config.font = wezterm.font_with_fallback {'VictorMono NFM'}
-- config.color_scheme = "Tokyo Night"
config.color_scheme = "GruvboxDarkHard"
config.default_cursor_style = 'SteadyBar'
config.window_background_opacity = 0.95
-- config.window_background_image = wezterm.config_dir .. "/assets/waves.gif"
-- config.window_background_image_hsb = {
--     brightness = 0.05,
--     hue = 1.0,
--     saturation = 1.0
-- }
config.window_decorations = "RESIZE"
config.hide_tab_bar_if_only_one_tab = true

return config
