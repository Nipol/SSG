FROM denoland/deno:bin-2.7.13 AS deno
FROM mcr.microsoft.com/devcontainers/rust:1-1-bullseye
COPY --from=deno /deno /usr/local/bin/deno

USER root

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install -g tailwindcss @tailwindcss/cli playwright \
  && npx playwright install-deps \
  && mkdir -p "${PLAYWRIGHT_BROWSERS_PATH}" \
  && playwright install --with-deps chromium \
  && chown -R vscode:vscode "${PLAYWRIGHT_BROWSERS_PATH}" \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

USER vscode
