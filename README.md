# dotfiles

- Generate a new `ssh` key and give it a passphrase

  ```sh
  ssh-keygen -t ed25519 -C "34140052+andrewbrey@users.noreply.github.com"
  ```

- Add the `ssh` key to `GitHub`: https://github.com/settings/keys (Add it twice, once as an
  "Authentication key" and once as a "Signing key")

- Clone dotfiles to local

  ```sh
  git clone git@github.com:andrewbrey/dotfiles.git ~/dotfiles
  ```

- Run bootstrap

  ```sh
  ~/dotfiles/script/bootstrap
  ```

- _(Optional)_ Delete manually cloned dotfiles now that there is a `chezmoi` managed copy

  > Use `chezmoi` to locate managed dotfiles, in particular with `$(chezmoi source-path)`

  ```sh
  rm -rf ~/dotfiles
  ```

- Log out and back in to ensure changes to the login shell are enabled

- Use the `pam` cli to install applications, e.g. a few apps at once

  ```sh
  pam install -a core-tools -a kitty -a fonts
  ```

  or a whole named group at once

  ```sh
  pam install -g devcontainer
  ```

- Use the `sam` cli to apply settings

  ```sh
  sam apply
  ```

## init script requirements

`init/` scripts should be executable and have a shebang similar to:

```sh
#!/usr/bin/env -S deno run --allow-sys --allow-read --allow-net --allow-env --allow-run
```

## Assumptions

- Running from an interactive terminal (TTY)
- `chezmoi` init happens last
- All linux stuff happens on a `debian` derivative that has `apt` as the package manager
- Only linux and mac are supported

## TODO

- Document usage of `DOTFILES_PASSPHRASE` within codespaces
- Document that direct usage of `chezmoi init` shouldn't happen - instead, invoke the bootstrap
  script as there are environment vars used during `chezmoi` config creation that are set by the
  bootstrap process
- Document and/or automate how to add new shell completions (as well as why they are encrypted in
  the first place)
- Document that the `.gitconfig` can only _easily_ be edited where it's not ignored because
  `chezmoi edit file` respects `.chezmoiignore` items (and won't decrypt the file to allow editing).
  Could do something like `decrypt in source -> pipe to tmp -> make edits -> encrypt back to source`
  but that is probably not worth it when you can just make edits in an environmtn where it's not
  ignored (i.e. not in a devcontainer)
- Fix `yarn-error.log` caused by env vars
- Document option to use:
  ```sh
  sh -c "$(curl -sSLf https://dotfiles.andrewbrey.com)"
  ```
  and how to do deploys to deno deploy using `.web` scripting

- Document interaction with GH Keys (`https://github.com/andrewbrey.keys`) as a public key authority
  and how they are provided to rpi's
  - In general, just need to document the "on boot" shell start background tasks
- Make `init` scripts idempotent so that if needed, the `bootstrap` script can be re-run on an
  already-configured system
- Address `TODO: refactor to os helpers` comments by using `$.onMac` and `$.onLinux` helpers
- Convert all apps to pull `InstallerMeta` at the top of the file instead at the end
- Refactor so install logic can be shared by update logic if they are the same process
- Update "single file binary" installers (skate, bat, etc) to use `eget` (as in `charm` installer)
- Fix whatever causes `tar` to exit with a code of 2 when extracting (e.g. `pam install flyctl`)
  - Spent time reproducing the error using `golang` installer, and confirmed the issue has to do
    with my code, not `tar`, not `dax`, not `gz`, not the archive from `golang` download
    site...weird, but I guess...good?
- Add [amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704?mt=12) MacOS app to
  replace `keepingyouawake` since it is able to prevent system sleep on mac better while still
  allowing screen to sleep
- Add [oatmeal](https://github.com/dustinblackman/oatmeal) llm terminal client
- Add [freeze](https://github.com/charmbracelet/freeze) code screenshot tool
- Add [flameshot](https://flameshot.org/) regular screenshot tool
- Add [Nu shell](https://www.nushell.sh/) for structured shell
- Add [PDF Arranger](https://flathub.org/apps/com.github.jeromerobert.pdfarranger) pdf tool
- Add [Yazi File Manager](https://github.com/sxyazi/yazi)
- Add [Cargo Binstall](https://crates.io/crates/cargo-binstall/) for faster cargo bin installs
- Add [Ferdium](https://ferdium.org/) to replace several nativefier applications
- Add [IconLibrary](https://flathub.org/apps/org.gnome.design.IconLibrary) for an icon viewer of
  system icons
- Address `nodesource` install script deprecation warning:
  ```
  SCRIPT DEPRECATION WARNING

  This script, located at https://deb.nodesource.com/setup_X, used to
  install Node.js is deprecated now and will eventually be made inactive.

  Please visit the NodeSource distributions Github and follow the
  instructions to migrate your repo.
  https://github.com/nodesource/distributions

  The NodeSource Node.js Linux distributions GitHub repository contains
  information about which versions of Node.js and which Linux distributions
  are supported and how to install it.
  https://github.com/nodesource/distributions
  ```
- Add a `script/teardown` script next to `script/bootstrap` which can be used to remove sensitive
  config files and secrets in one command. Might be able to just use `chezmoi purge`
  (https://www.chezmoi.io/user-guide/advanced/migrate-away-from-chezmoi/). Should remove at least:
  - `~/.local/share/chezmoi` (_contains chezmoi source state_)
  - `~/.config/chezmoi` (_contains chezmoi config files_)
  - `~/.dots/.extra` (_prompt to read file before delete, may contain saveable info_)
  - `~/.dots`
  - `~/dotfiles` (_might not be present, depending on install steps followed_)
  - `~/.ssh` (_confirmation prompt, also notify that ssh keys should be untrusted in GitHub_)
  - `~/.zshrc`
  - `~/.gitconfig`
- Remove (and probably replace) deprecated `neofetch` application
- In `fonts` no longer need to tap the `homebrew/cask-fonts` cask (and doing so causes brew process
  to exit non-zero)
