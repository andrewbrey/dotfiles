FROM mcr.microsoft.com/devcontainers/base:jammy

ARG BUILD_PASSPHRASE=""

RUN su vscode -c 'export DENO_INSTALL="${HOME}/.deno" && curl -fsSL https://deno.land/x/install/install.sh | sh'
RUN su vscode -c 'export CHEZMOI_INSTALL="${HOME}/.local/bin" && mkdir -p "${CHEZMOI_INSTALL}" && sh -c "$(curl -fsSL get.chezmoi.io)" -- -b "${CHEZMOI_INSTALL}"'
RUN su vscode -c 'sh -c "$(curl -fsSL https://starship.rs/install.sh)" -- --yes'
RUN su vscode -c 'curl -fsSL https://webi.sh/shfmt | sh'

ENV EDITOR="code -w" VISUAL="code -w" PERSONAL_MACHINE=true DOTFILES_PASSPHRASE=${BUILD_PASSPHRASE}
ENV DOTFILES_SRC_PATH_OVERRIDE="/workspaces/chezmoi"
