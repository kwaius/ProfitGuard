#!/bin/sh
set -eu

echo "Iniciando ProfitGuard..."

if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*)
      DB_CONNECTION="${DATABASE_URL#jdbc:postgresql://}"
      DB_CONNECTION="${DB_CONNECTION#*@}"
      export DB_URL="jdbc:postgresql://${DB_CONNECTION}"
      ;;
    postgresql://*|postgres://*)
      DB_CONNECTION="${DATABASE_URL#*://}"
      DB_CONNECTION="${DB_CONNECTION#*@}"
      export DB_URL="jdbc:postgresql://${DB_CONNECTION}"
      ;;
    *)
      echo "ERRO: Formato de DATABASE_URL desconhecido."
      exit 1
      ;;
  esac
fi

: "${DB_URL:?DATABASE_URL nao configurada}"
: "${DB_USERNAME:?DB_USERNAME nao configurada}"
: "${DB_PASSWORD:?DB_PASSWORD nao configurada}"

echo "URL JDBC configurada."
echo "Usuario do banco configurado."
echo "Iniciando aplicacao Spring Boot..."

exec java -jar /app/app.jar
