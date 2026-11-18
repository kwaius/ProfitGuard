# ProfitGuard

O ProfitGuard reúne informações financeiras, planejamento de caixa e contexto de mercado para apoiar a gestão de pequenos negócios. Esta versão conta com uma landing page pública, área de login, dashboard e API própria com banco de dados.

## Módulos

- **Landing page:** apresenta o sistema e direciona para o acesso.
- **Login:** autenticação no backend com senha armazenada em hash BCrypt e sessão HTTP.
- **Dashboard:** indicadores financeiros calculados a partir das transações registradas.
- **Transações e relatórios:** consulta, cadastro, edição, exclusão e filtros.
- **Fluxo de caixa:** saldo informado, reserva mínima, compromissos e projeções.
- **Mercado Global:** notícias e pesquisa inicial de comércio exterior, com indicação das fontes disponíveis.
- **Contadores:** cadastro de contatos e resumo financeiro para compartilhamento manual.
- **ProfitGuard AI:** interpreta os dados disponíveis e pode usar contexto de mercado quando a fonte responde.

## Requisitos

- Node.js compatível com a versão do Vite do projeto.
- Java 17 ou superior.
- Conexão com a internet na primeira execução do Maven Wrapper para baixar o Maven e as dependências Java.
- Ollama e o modelo `qwen3.5:4b` para usar a IA local durante o desenvolvimento.

## Como iniciar no Windows

O front-end e o backend rodam em terminais separados. Inicie o backend primeiro.

### 1. Backend e banco de dados

Abra um PowerShell na pasta `backend` e execute:

```powershell
.\mvnw.cmd spring-boot:run
```

A API ficará em `http://localhost:8080`. O banco local usa H2 em arquivo e é criado automaticamente na primeira inicialização, na pasta `backend/data/`. Os registros continuam salvos quando o servidor é fechado.

### 2. Front-end

Abra outro PowerShell na pasta principal do projeto, onde está o `package.json`:

```powershell
npm.cmd install
npm.cmd run dev
```

Acesse o endereço informado pelo Vite, normalmente `http://localhost:5173`. A landing page fica em `/` e o login em `/login`.

### 3. Conta pronta para apresentação

No ambiente local, a primeira inicialização cria automaticamente uma conta de demonstração. A senha é armazenada no banco como hash BCrypt, não em texto puro.

| Campo | Acesso de demonstração |
|---|---|
| E-mail | `demo@profitguard.com` |
| Senha | `Profit@12345` |

A tela de login preenche esses dados automaticamente apenas durante o desenvolvimento local. Não reutilize essa senha em um ambiente público.

### 4. IA local (opcional)

Em um terceiro terminal:

```powershell
ollama pull qwen3.5:4b
ollama run qwen3.5:4b --think=false
```

Mantenha o Ollama aberto durante os testes. A API financeira e o banco continuam funcionando sem o Ollama; apenas as respostas locais da IA ficam indisponíveis.

## Banco de dados

O perfil local usa H2 persistente:

- Arquivo: `backend/data/profitguard.mv.db`
- JDBC URL: `jdbc:h2:file:./data/profitguard;DB_CLOSE_ON_EXIT=FALSE`
- Usuário do banco: `sa`
- Senha do banco: vazia
- Console H2: `http://localhost:8080/h2-console`

A tabela `app_user` contém a conta de demonstração. O backend também carrega dados de exemplo de produtos, vendas e movimentações financeiras quando o banco está vazio.

**Sobre os dados da versão anterior:** as transações que estavam salvas somente no `localStorage` do navegador não são copiadas automaticamente para o H2. A primeira execução usa os registros de demonstração carregados pelo backend. Guarde o projeto antigo e exporte/anote os dados locais que precisar manter antes de trocar definitivamente para esta versão.

**Atenção:** os dados financeiros deste MVP pertencem a um único espaço de demonstração. O login protege as rotas da API, mas ainda não existe separação de registros por usuário/empresa. Não habilite cadastro de múltiplos usuários antes de implementar essa separação.

Para recriar o banco de demonstração do zero, pare o backend e apague a pasta `backend/data/`. Isso apaga também todas as transações, contatos e configurações salvas localmente no banco.

## Publicação com PostgreSQL

A publicação recomendada para esta versão é Vercel (frontend e funções Node) + Render (backend Spring Boot e PostgreSQL). O arquivo `render.yaml` configura o serviço e o banco. O arquivo `vercel.json` cria um proxy para `/backend-api/*`, e o cliente React usa esse caminho automaticamente em produção.

Siga o passo a passo completo em `DEPLOY_VERCEL_RENDER.md`. Para desenvolvimento local, mantenha `VITE_API_URL=http://localhost:8080` em `.env.local`; no Vercel, não configure essa variável apontando para `localhost`.

No Render, a conta inicial de demonstração é habilitada por `DEMO_USER_ENABLED=true`. O valor da senha deve ser informado como segredo no momento de criar o Blueprint, não salvo no Git.

## Endpoints principais

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `/api/transactions`
- `/api/cashflow/settings` e `/api/cashflow/scheduled`
- `/api/accountants`
- `/api/produtos`, `/api/vendas`, `/api/estoque`
- `/api/dashboard`, `/api/recomendacoes`, `/api/cenario/dolar`
- `GET /api/health` (público)

As rotas de dados exigem sessão autenticada. O front-end envia o cookie de sessão nas chamadas à API.

## Comandos úteis do front-end

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```


## Publicar no Vercel + Render

Para produção, use o Vercel para a interface e funções Node, e o Render para a API Spring Boot e PostgreSQL. O arquivo `render.yaml` cria o backend e o banco; `vercel.json` encaminha `/backend-api/*` para o backend. Siga `DEPLOY_VERCEL_RENDER.md` para a ordem de publicação, configuração da conta de apresentação e testes.
