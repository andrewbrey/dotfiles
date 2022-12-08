# dotfiles

- Generate a new `ssh` key and give it a passphrase

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
#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run
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
