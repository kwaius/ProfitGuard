#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
    case "$DATABASE_URL" in
        jdbc:*)
            DB_URL="$DATABASE_URL"
            ;;
        postgresql://*)
            DB_URL="jdbc:$DATABASE_URL"
            ;;
        postgres://*)
            DB_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
            ;;
    esac
    export DB_URL
fi

: "${DB_URL:?DB_URL não configurada}"
: "${DB_USERNAME:?DB_USERNAME não configurada}"
: "${DB_PASSWORD:?DB_PASSWORD não configurada}"

exec java -jar /app/app.jar