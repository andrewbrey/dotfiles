# dotfiles

- Generate a new `ssh` key

  ```sh
  ssh-keygen -t ed25519 -C "34140052+andrewbrey@users.noreply.github.com"
  ```

- Add the `ssh` key to `GitHub`: https://github.com/settings/keys

- Clone dotfiles to local

  ```sh
  git clone git@github.com:andrewbrey/dotfiles.git ~/dotfiles
  ```

- Run bootstrap

  ```sh
  ~/dotfiles/script/bootstrap
  ```

## TODO

- Document usage of `DOTFILES_PASSPHRASE` within codespaces
- Document that direct usage of `chezmoi init` shouldn't happen - instead, invoke the bootstrap
  script as there are environment vars used during `chezmoi` config creation that are set by the
  bootstrap process
