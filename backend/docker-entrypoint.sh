<<<<<<< HEAD

#!/bin/sh
set -eu

echo "Iniciando ProfitGuard..."

if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*)
      export DB_URL="$DATABASE_URL"
      ;;
    postgresql://*)
      export DB_URL="jdbc:postgresql://${DATABASE_URL#postgresql://}"
      ;;
    postgres://*)
      export DB_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
      ;;
    *)
      echo "ERRO: Formato de DATABASE_URL desconhecido."
      exit 1
      ;;
  esac
fi

: "${DB_URL:?DATABASE_URL ou DB_URL não configurada}"
: "${DB_USERNAME:?DB_USERNAME não configurada}"
: "${DB_PASSWORD:?DB_PASSWORD não configurada}"

echo "URL JDBC configurada."
echo "Usuário do banco configurado."
echo "Iniciando aplicação Spring Boot..."

exec java -jar /app/app.jar
=======

#!/bin/sh
set -eu

echo "Iniciando ProfitGuard..."

if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*)
      export DB_URL="$DATABASE_URL"
      ;;
    postgresql://*)
      export DB_URL="jdbc:postgresql://${DATABASE_URL#postgresql://}"
      ;;
    postgres://*)
      export DB_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
      ;;
    *)
      echo "ERRO: Formato de DATABASE_URL desconhecido."
      exit 1
      ;;
  esac
fi

: "${DB_URL:?DATABASE_URL ou DB_URL não configurada}"
: "${DB_USERNAME:?DB_USERNAME não configurada}"
: "${DB_PASSWORD:?DB_PASSWORD não configurada}"

echo "URL JDBC configurada."
echo "Usuário do banco configurado."
echo "Iniciando aplicação Spring Boot..."

exec java -jar /app/app.jar
>>>>>>> 4bd820e (Corrige formato do docker entrypoint)
