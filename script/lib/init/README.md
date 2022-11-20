# Script requirements

`/bin` scripts should be executable and have a shebang similar to:

```sh
#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run
```

# Assumptions

- Running from an interactive terminal
- `chezmoi` init happens last
- All linux stuff happens on a `debian` derivative that has `apt` as the package manager
- Only linux and mac are supported
