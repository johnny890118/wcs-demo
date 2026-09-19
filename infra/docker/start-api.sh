#!/bin/sh
set -eu

node dist/runtime/database/migrate.mjs
exec node dist/runtime/main.mjs
