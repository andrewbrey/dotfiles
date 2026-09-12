# Zellij Passthrough

A local Zellij plugin that adds a passthrough state to Zellij's real `locked`
mode for one pane. While that pane is focused, every locked-mode binding except
`F12` is unbound so all other input reaches the underlying foreground program.
Focusing another pane or tab restores normal Zellij behavior; returning to the
armed pane resumes passthrough. Press `F12` again to disarm it. While active,
the pane is highlighted and its name ends with `[PASSTHROUGH]`.

Nothing is downloaded or contacted at runtime. The plugin is a local WASM file.
Key changes are runtime-only: it passes `write_config_to_disk = false` to
Zellij's `rebind_keys` API.

## Compatibility

The `zellij-tile` dependency should match your installed Zellij version. Check:

```sh
zellij --version
```

`Cargo.toml` currently uses `zellij-tile = "=0.45.1"`. Change that version if
your host runs another Zellij release. Plugin APIs can be incompatible across
Zellij versions.

## Build

Install Rust, then add the WASI target and build:

```sh
rustup target add wasm32-wasip1
cd /path/to/zellij-passthrough
cargo build --release --target wasm32-wasip1
```

The output is:

```text
target/wasm32-wasip1/release/zellij-passthrough.wasm
```

The release profile enables size optimization, LTO, a single codegen unit,
symbol stripping, and abort-on-panic. For additional post-link optimization,
install Binaryen and run:

```sh
wasm-opt -Oz \
  target/wasm32-wasip1/release/zellij-passthrough.wasm \
  -o target/wasm32-wasip1/release/zellij-passthrough.opt.wasm
```

Test the optimized file before committing it. Use the `.opt.wasm` file in the
installation command if it works with your Zellij version.

## Install

Copy the WASM file to the zellij plugins dir:

```sh
mkdir -p ~/.config/zellij/plugins
cp target/wasm32-wasip1/release/zellij-passthrough.wasm \
  ~/.config/zellij/plugins/zellij-passthrough.wasm
```

Add an alias and background load to `~/.config/zellij/config.kdl`:

```kdl
plugins {
    zellij-passthrough location="file:~/.config/zellij/plugins/zellij-passthrough.wasm"

    // Keep your other aliases here.
}

load_plugins {
    zellij-passthrough
}
```

Add the toggle to the existing `locked` block:

```kdl
locked {
    bind "Ctrl g" { SwitchToMode "normal"; }
    bind "F12" {
        MessagePlugin "zellij-passthrough" {
            name "toggle"
        }
    }
}
```

Restart Zellij. On first load, approve the plugin's **Read application state**,
**Change application state**, and **Reconfigure** permissions. These are needed
to capture and rebind keys, highlight the focused pane, and temporarily rename
it.

## Usage

While in locked mode:

- Press `F12` while in `locked` mode to arm a given pane.
- While it remains focused, only `F12` is handled by Zellij; the pane is
  highlighted and suffixed with `[PASSTHROUGH]`.
- Focus another pane or tab to restore normal Zellij bindings automatically.
- Return to the armed pane to resume passthrough.
- Press `F12` to disarm the pane completely.

The original keymap is captured from Zellij and restored verbatim whenever the
armed pane is not focused or passthrough is disarmed.

## Limitations

- The plugin arms one pane, but runtime key rebinding still applies at the
  current Zellij client/user level while that pane is focused.
- If you reload/change keybindings while the plugin is running, restart the
  Zellij session so the plugin captures the new originals.
- The plugin must receive Zellij's initial keybinding state before it can
  toggle. Zellij normally sends this immediately after loading it; an earlier
  toggle is simply ignored.

## Zellij references

- https://zellij.dev/documentation/plugins.html
- https://zellij.dev/documentation/plugin-api.html
- https://zellij.dev/documentation/keybindings.html
