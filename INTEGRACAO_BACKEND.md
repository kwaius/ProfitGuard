# Integração do ProfitGuard com o backend

O front-end React conversa com uma API Spring Boot. Os dados financeiros, configurações do fluxo de caixa, compromissos previstos e contatos de contadores são persistidos no banco relacional.

## Serviços locais

- Front-end: Vite em `http://localhost:5173`
- Backend: Spring Boot em `http://localhost:8080`
- Banco: H2 em arquivo em `backend/data/profitguard.mv.db`

O cliente HTTP fica em `src/api/client.js`; o hook `src/hooks/useApiData.js` carrega e atualiza transações e fluxo de caixa. As chamadas incluem o cookie de sessão (`credentials: include`).

## Autenticação

O acesso é feito por `POST /api/auth/login`. O servidor valida a senha com BCrypt e salva o contexto autenticado em uma sessão HTTP. `GET /api/auth/me` recupera o usuário da sessão e `POST /api/auth/logout` encerra a sessão.

As rotas `/api/health` e `/api/auth/login` são públicas. As demais rotas da API exigem autenticação.

Conta local de demonstração:

- E-mail: `demo@profitguard.com`
- Senha: `Profit@12345`

Ela é criada automaticamente no perfil local quando ainda não existe. No perfil `prod`, o cadastro inicial fica desabilitado por padrão e pode ser habilitado com variáveis de ambiente.

## O que é persistido

- Transações (criar, editar, excluir e restaurar dados de exemplo).
- Saldo informado e reserva mínima do fluxo de caixa.
- Lançamentos futuros (criar, excluir e dar baixa).
- Contatos de contadores.
- Conta de acesso (senha armazenada em hash BCrypt).

Tema e algumas preferências de interface continuam no `localStorage`.

## Observação sobre contas

Esta entrega usa um único espaço de dados para a apresentação. A autenticação protege a API, mas as tabelas financeiras ainda não têm relacionamento com `app_user`. Portanto, não cadastre vários usuários esperando dados isolados entre empresas.

## Inicialização

Primeiro, na pasta `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

Depois, na raiz do front-end:

```powershell
npm.cmd install
npm.cmd run dev
```

Consulte o `README.md` para os detalhes de H2, PostgreSQL e variáveis de ambiente.
