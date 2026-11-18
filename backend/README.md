# ProfitGuard — Backend

API REST em Spring Boot para os módulos financeiros, estoque, vendas e autenticação.

## Desenvolvimento local

Requisitos: Java 17 ou superior e acesso à internet na primeira execução do Maven Wrapper.

No Windows PowerShell, nesta pasta:

```powershell
.\mvnw.cmd spring-boot:run
```

API: `http://localhost:8080/api/health`

O perfil local usa H2 em arquivo: `./data/profitguard.mv.db`. Usuário `sa`, senha vazia. Console em `http://localhost:8080/h2-console` com a JDBC URL `jdbc:h2:file:./data/profitguard;DB_CLOSE_ON_EXIT=FALSE`.

Na primeira inicialização, se ainda não existir, é criada a conta local:

- `demo@profitguard.com`
- `Profit@12345`

A senha é codificada com BCrypt antes de ser salva.

## Autenticação

- `POST /api/auth/login` — autentica e inicia uma sessão HTTP.
- `GET /api/auth/me` — consulta o usuário da sessão.
- `POST /api/auth/logout` — encerra a sessão.

`/api/health` e `/api/auth/login` são públicos. As demais rotas exigem sessão autenticada. O CORS aceita as origens definidas em `CORS_ORIGINS` e permite credenciais para o cookie de sessão.

## Produção

O perfil `prod` usa PostgreSQL. No Render, o serviço recebe `DATABASE_URL`, `DB_USERNAME` e `DB_PASSWORD`. O script `docker-entrypoint.sh` converte a URL de conexão do Render para JDBC e inicia a aplicação. Também configure `SPRING_PROFILES_ACTIVE=prod`, `CORS_ORIGINS` e as variáveis da conta de demonstração, se necessário.

A conta inicial de produção fica desabilitada por padrão. Para criá-la no startup, defina `DEMO_USER_ENABLED=true`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` e, opcionalmente, `DEMO_USER_NAME`. Use uma senha forte e exclusiva.

## Limitação atual

O login protege os endpoints, mas os dados operacionais ainda pertencem a um único espaço de demonstração e não são isolados por usuário/empresa. A separação multiempresa precisa ser implementada antes de abrir cadastro para vários clientes.
