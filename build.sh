#!/bin/sh
DENO_VERSION="v1.35.3"
curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=./deno-v1.35.3 sh -s v1.35.3
NO_COLOR=1 DENO_VERSION=v1.35.3 \
    ./deno-v1.35.3/bin/deno task tailwind:build \
    && ./deno-v1.35.3/bin/deno task build \