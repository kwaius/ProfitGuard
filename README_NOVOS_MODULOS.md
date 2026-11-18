# ProfitGuard — novos módulos

Este pacote acrescenta três módulos ao projeto que já existia, mantendo o React/Vite e o armazenamento atual em `localStorage`.

## 1. Fluxo de Caixa

- O saldo disponível hoje e a reserva mínima são configurados pelo usuário.
- É possível cadastrar entradas e saídas previstas com vencimento.
- A tela projeta o saldo para 30, 60 e 90 dias usando o saldo informado e os compromissos cadastrados.
- Um compromisso pode ser baixado e transformado em transação realizada, ou excluído.
- A IA recebe um resumo do fluxo de caixa para ajudar a interpretar os números.
- A projeção não inventa recebimentos recorrentes quando não foram cadastrados. Um resultado positivo significa apenas que os lançamentos registrados mantêm o saldo positivo.

## 2. Mercado Global e Radar de Exportação

- `/api/market` consulta notícias econômicas/comerciais no GDELT Project.
- A pesquisa de produto consulta a prévia pública do UN Comtrade para listar destinos observados nas exportações brasileiras do código HS associado ao produto.
- As notícias exibem fonte, data e link. O usuário pode pedir uma análise contextual à IA.
- A IA também busca dados globais quando a pergunta trata de crises, comércio internacional, exportação ou uma análise geral das finanças.
- O comércio histórico é uma evidência do que já foi exportado, não uma garantia de demanda futura nem recomendação definitiva de exportação. Custos, logística, tarifas, normas e capacidade de entrega precisam ser avaliados à parte.
- Esta versão mapeia automaticamente café, cacau/chocolate, soja, mel, carne bovina, calçados, cosméticos, vestuário, frutas, açúcar, máquinas e eletrônicos. Produtos fora desse conjunto informam que ainda não há mapeamento automático.

Fontes integradas:
- GDELT Project: https://www.gdeltproject.org/
- UN Comtrade: https://comtradeapi.un.org/

## 3. Contadores

- Permite guardar nome, escritório, especialidade, região, e-mail, WhatsApp e observações.
- Permite abrir um contato por WhatsApp/e-mail e preparar um resumo das transações para envio por e-mail.
- O resumo só é compartilhado mediante ação do usuário.
- Os contatos ficam no navegador que os cadastrou. Não há ainda diretório público, contas de contador, mensagens internas, sincronização entre dispositivos ou banco de dados multiusuário; isso exige autenticação e backend persistente.

## Instalação

1. Faça uma cópia de segurança da pasta atual do projeto.
2. Extraia este ZIP e abra a pasta `profitguard`.
3. Instale as dependências com `npm install` caso a pasta `node_modules` não esteja disponível.
4. Execute `npm run dev` para abrir o sistema localmente.
5. Para produção, publique na Vercel como o projeto já fazia. A rota `api/market.js` é reconhecida como `/api/market`.

A integração de IA existente continua usando a configuração anterior, inclusive a variável `OLLAMA_API_KEY` na Vercel.

## Dados locais

O projeto continua guardando transações, preferências de fluxo de caixa, compromissos e contatos no `localStorage`. Isso é adequado para o MVP de demonstração, mas não substitui um banco de dados autenticado para uso empresarial real.

## Execução local da IA e notícias

- `npm run dev` inicia somente o site Vite; para a IA local, o Ollama também precisa estar ativo.
- Em outro terminal, execute `ollama run qwen3.5:4b --think=false` e mantenha-o aberto.
- Se o modelo não estiver instalado, execute `ollama pull qwen3.5:4b`.
- O Radar Global tenta a API local do projeto e, se a API responder sem notícias, tenta consultar a fonte pública diretamente. A disponibilidade depende da conexão e da fonte externa.
