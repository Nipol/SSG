#!/bin/sh
npm install tailwindcss @tailwindcss/cli playwright
npx playwright install --with-deps chromium
curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=./deno sh -s v2.1.9

NO_COLOR=1 npx @tailwindcss/cli -i main.css -o dist/build.css -m \
&& NO_COLOR=1 ./deno/bin/deno task build