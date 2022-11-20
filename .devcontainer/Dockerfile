FROM mcr.microsoft.com/devcontainers/base:jammy

ARG BUILD_PASSPHRASE=""

RUN su vscode -c 'export DENO_INSTALL="${HOME}/.deno" && curl -fsSL https://deno.land/x/install/install.sh | sh'
RUN su vscode -c 'export CHEZMOI_INSTALL="${HOME}/.local/bin" && mkdir -p "${CHEZMOI_INSTALL}" && sh -c "$(curl -fsLS get.chezmoi.io)" -- -b "${CHEZMOI_INSTALL}"'

ENV EDITOR="code -w" DOTFILES_PASSPHRASE=${BUILD_PASSPHRASE}