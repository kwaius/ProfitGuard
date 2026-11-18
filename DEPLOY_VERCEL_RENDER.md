# Publicar o ProfitGuard no Vercel + Render

O Vercel hospeda a interface React e as funções Node em `api/`. O backend Spring Boot precisa ficar em um serviço Java/Docker separado. Esta configuração usa o Render para o backend e PostgreSQL, e o Vercel encaminha `/backend-api/*` para o Render sem expor o endereço do backend no navegador.

## 1. Envie esta versão ao GitHub

Substitua os arquivos do repositório pela pasta deste projeto e faça commit/push. Mantenha o diretório raiz do projeto (onde ficam `package.json`, `src/`, `api/` e `render.yaml`) como Root Directory no Vercel e no Render.

## 2. Crie o backend e banco no Render

1. Entre em https://dashboard.render.com/.
2. Escolha **New > Blueprint** e conecte o mesmo repositório GitHub.
3. Selecione o `render.yaml` que fica na raiz do projeto.
4. Quando o Render solicitar `DEMO_USER_PASSWORD`, informe `Profit@12345` para a conta de apresentação.
5. Confirme a criação dos serviços. O Render criará o PostgreSQL e o serviço Docker do Spring Boot.
6. Aguarde o deploy terminar.
7. Abra `https://profitguard-backend-demo.onrender.com/api/health`. A resposta esperada é JSON com `status: ok`.

Se o Render não permitir usar o nome `profitguard-backend-demo`, escolha outro nome e altere o domínio correspondente no `vercel.json`. A rota de saúde precisa responder antes de seguir.

## 3. Atualize o frontend no Vercel

1. Faça push do arquivo `vercel.json` e de `src/api/client.js` para o mesmo repositório ligado ao Vercel.
2. No Vercel, abra **Project > Settings > Environment Variables**. Remova qualquer `VITE_API_URL` de produção que aponte para `localhost` ou para o endereço antigo da API. A versão atual usa `/backend-api` automaticamente em produção.
3. Faça um novo deploy de Production. Alterações de configuração/variáveis só entram nos novos deployments.
4. Confira se o domínio público continua abrindo a landing page e `/login`.

## 4. Conta de apresentação

O Render cria automaticamente, na primeira inicialização do banco, a conta:

- E-mail: `demo@profitguard.com`
- Senha: o valor informado em `DEMO_USER_PASSWORD` na criação do Blueprint (use `Profit@12345` para a demonstração).

A senha é salva no banco como hash BCrypt. Se você alterar a variável depois que a conta já existir, o inicializador não troca a senha de uma conta existente. Para trocar, atualize a senha no banco com procedimento seguro ou crie outra conta de demonstração.

## 5. Teste antes de apresentar

1. Abra `/backend-api/api/health` no domínio do Vercel. Deve retornar `status: ok` (a chamada passa pelo proxy).
2. Abra `/login` e entre com a conta de demonstração.
3. Cadastre uma transação pequena e confirme que aparece no dashboard.
4. Atualize a página e confirme que a sessão e os dados continuam disponíveis.
5. Faça logout e tente abrir `/dashboard`; a aplicação deve pedir login novamente.

## Importante sobre o plano gratuito Render

O serviço web gratuito entra em repouso após 15 minutos sem tráfego e pode levar cerca de um minuto para acordar. O PostgreSQL gratuito expira após 30 dias e, após um período de tolerância, os dados podem ser apagados. Para a apresentação, abra `/backend-api/api/health` alguns minutos antes e teste o login. Para manter o projeto por mais tempo, faça upgrade da base para um plano pago ou use outro PostgreSQL persistente.

## Sessão, cookies e proxy

O navegador faz requisições ao próprio domínio do Vercel em `/backend-api`. O Vercel reescreve essas chamadas para o serviço Render. Isso mantém a sessão e o cookie CSRF no mesmo domínio público da interface e evita depender de cookies de terceiros. Em produção, o backend marca os cookies como `Secure` e `SameSite=None`.

## Se a URL de saúde não responder

- Verifique o log de deploy do backend no Render.
- Confira se as variáveis `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SPRING_PROFILES_ACTIVE=prod`, `DEMO_USER_ENABLED=true` e `DEMO_USER_PASSWORD` existem.
- Confirme que `vercel.json` aponta para o domínio exato `onrender.com` do backend.
- Depois de alterar o `vercel.json`, faça um novo deploy do Vercel.
