FROM denoland/deno:bin-2.1.9 AS deno
FROM mcr.microsoft.com/devcontainers/rust:1-1-bullseye
COPY --from=deno /deno /usr/local/bin/deno

USER vscode