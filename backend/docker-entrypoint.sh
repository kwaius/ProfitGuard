#!/bin/sh
set -eu

# O Render fornece DATABASE_URL no formato postgresql://.
# O driver JDBC do Spring precisa do prefixo jdbc:postgresql://.
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*) export DB_URL="$DATABASE_URL" ;;
    postgresql://*) export DB_URL="jdbc:postgresql://${DATABASE_URL#postgresql://}" ;;
    postgres://*) export DB_URL="jdbc:postgresql://${DATABASE_URL#postgres://}" ;;
  esac
fi

: "${DB_URL:?Configure DATABASE_URL no serviço ou DB_URL manualmente.}"
: "${DB_USERNAME:?Configure DB_USERNAME.}"
: "${DB_PASSWORD:?Configure DB_PASSWORD.}"

exec java -jar /app/app.jar
