FROM mcr.microsoft.com/devcontainers/base:jammy

ARG BUILD_PASSPHRASE=""

RUN su vscode -c 'export DENO_INSTALL="${HOME}/.deno" && curl -fsSL https://deno.land/x/install/install.sh | sh'
RUN su vscode -c 'export CHEZMOI_INSTALL="${HOME}/.local/bin" && mkdir -p "${CHEZMOI_INSTALL}" && sh -c "$(curl -fsSL get.chezmoi.io)" -- -b "${CHEZMOI_INSTALL}"'
RUN su vscode -c 'curl -fsSL https://starship.rs/install.sh | sh'

ENV EDITOR="code -w" DOTFILES_PASSPHRASE=${BUILD_PASSPHRASE}
