# Correções do ProfitGuard — IA e Mercado Global

Esta versão corrige pontos percebidos durante o teste local.

## O que mudou

- O leitor de streaming agora processa o último registro mesmo se a conexão terminar sem quebra de linha.
- A IA recebe um orçamento de geração maior e pode continuar uma resposta uma vez se o modelo sinalizar limite de tokens ou deixar Markdown claramente incompleto.
- O histórico troca prompts internos enormes de análise por mensagens legíveis, para não exibir o JSON de contexto como se fosse texto digitado pelo usuário.
- O Radar Global solicita cobertura em português, descarta notícias identificadas em outros idiomas e normaliza as datas compactas da GDELT.
- O endpoint `/api/market` tem middleware local no Vite, para as pesquisas de notícia e exportação funcionarem no modo `npm run dev` sem depender de CORS do navegador.
- A pesquisa de exportação reconhece `camiseta` e consulta o código HS 6109 (camisetas de malha). Produtos sem mapeamento recebem uma explicação clara.

## Como testar no Windows

1. Pare o Vite anterior com `Ctrl + C`.
2. Extraia este ZIP em uma pasta nova.
3. Abra o terminal na pasta que contém `package.json`.
4. Rode `npm.cmd install` e depois `npm.cmd run dev`.
5. Para IA local, deixe o Ollama funcionando em outro terminal com `ollama run qwen3.5:4b --think=false`.
6. Teste o chat, o botão de atualizar notícias e a pesquisa por `camiseta`.

As notícias dependem da disponibilidade da GDELT e são filtradas para cobertura em português. A pesquisa comercial usa estatísticas históricas do UN Comtrade; ela não garante demanda futura. Alguns produtos especializados ainda podem não ter mapeamento HS próprio nesta versão.
