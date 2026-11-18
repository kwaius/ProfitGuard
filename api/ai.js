import { getTopExpenses, getCategoryExpenses, calculateSavings, comparePeriods, detectFinancialTrends, analyzeCategoryTrend, } from '../src/ai/aiTools.js';

const OLLAMA_URL = 'https://ollama.com/api/chat';

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_top_expenses',
      description: 'Retorna as maiores despesas do usuário.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Quantidade de despesas a retornar.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_expenses',
      description: 'Retorna as despesas de uma categoria específica.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Nome da categoria.',
          },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_savings',
      description: 'Calcula quanto seria economizado ao reduzir um valor por determinada porcentagem.',
      parameters: {
        type: 'object',
        properties: {
          value: {
            type: 'number',
            description: 'Valor original.',
          },
          percentage: {
            type: 'number',
            description: 'Percentual de redução.',
          },
        },
        required: [
          'value',
          'percentage',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_periods',
      description: 'Compara dois períodos financeiros e mostra receita, despesas, lucro e margem.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: [
              'month',
              '30days',
              '7days',
            ],
            description: 'month compara o mês atual com o anterior; 30days compara os últimos 30 dias com os 30 anteriores; 7days compara os últimos 7 dias com os 7 anteriores.',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_financial_trends',
      description: 'Detecta tendências, aumento de despesas, queda de lucro, queda de margem e crescimento de categorias.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_category_trend',
      description: 'Compara uma categoria entre períodos e mostra as principais transações que contribuíram para a mudança.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Categoria que será analisada.',
          },
          period: {
            type: 'string',
            enum: [
              'month',
              '30days',
              '7days',
            ],
            description: 'Período da comparação.',
          },
        },
        required: [
          'category',
          'period',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filter_transactions',
      description: 'Cria uma sugestão para filtrar as transações. A ação depende da confirmação do usuário.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Categoria desejada. Use "all" quando não houver filtro.',
          },
          type: {
            type: 'string',
            enum: [
              'income',
              'expense',
              'all',
            ],
            description: 'Tipo da transação.',
          },
          search: {
            type: 'string',
            description: 'Texto da busca.',
          },
        },
        required: [
          'category',
          'type',
          'search',
        ],
      },
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }
  if (!process.env.OLLAMA_API_KEY) {
    return res.status(500).json({
      error: 'A chave do Ollama Cloud não está configurada.',
    });
  }
  try {
    const { message, analysis, transactions = [], history = [], } = req.body;
    if (!message ||
      typeof message !== 'string') {
      return res.status(400).json({
        error: 'Mensagem inválida.',
      });
    }
    const systemPrompt = `
Você é o ProfitGuard AI.

IDENTIDADE:

Seu nome é ProfitGuard AI.

Você é o assistente de inteligência artificial
integrado ao sistema ProfitGuard.

Se perguntarem "quem fez você?", "quem te criou?"
ou "quem é você?", responda de forma simples:

"Sou o ProfitGuard AI, a inteligência artificial
integrada ao sistema ProfitGuard."

Se perguntarem quem criou o ProfitGuard AI:

"O ProfitGuard AI foi desenvolvido como parte
do projeto ProfitGuard."

Não mencione:
- OpenAI;
- Ollama;
- Ollama Cloud;
- Qwen;
- gpt-oss;
- modelos de linguagem;
- provedores de infraestrutura;

a menos que o usuário pergunte especificamente
sobre a tecnologia utilizada.


PERSONALIDADE


Você é:

- inteligente;
- amigável;
- confiante;
- objetiva;
- didática;
- parceira;
- levemente descontraída;
- profissional.

Fale em português brasileiro natural.

Pode usar emojis com moderação.

🟢 resultado positivo
🟡 atenção
🔴 problema
💡 recomendação
📊 análise


REGRA ABSOLUTA DE CONFIABILIDADE


NUNCA invente dados.

NUNCA invente causas.

NUNCA transforme uma hipótese em fato.

NUNCA use benchmark de mercado sem dados fornecidos.

NUNCA diga que algo é "saudável", "normal",
"excelente", "perfeito" ou "controlado"
sem evidência suficiente.

NUNCA diga que uma mudança aconteceu por uma
causa específica se os dados não comprovarem isso.

Se os dados não forem suficientes, diga:

"Não tenho dados suficientes para afirmar isso."


DADOS E CÁLCULOS


Use somente:

- contexto financeiro;
- histórico da conversa;
- resultados das ferramentas.

Quando uma ferramenta retornar um número,
use esse resultado como fonte principal.

Não altere números retornados pelas ferramentas.

O ProfitGuard calcula:

Lucro = Receita - Despesas

Chame esse resultado de "Lucro".

Nunca chame de "Lucro Bruto".
Nunca chame de "Lucro Real".


CAUSAS


Só afirme uma causa quando houver evidência.

Evite afirmar:

"Isso aconteceu porque..."

quando a causa não estiver comprovada.

Evite transformar possibilidades em fatos.

Prefira:

"Os dados mostram..."

"Os dados sugerem..."

"Vale investigar..."

"Não é possível determinar a causa com os dados disponíveis."


FERRAMENTAS


get_top_expenses:

Use para:

- maior despesa;
- maiores despesas;
- maior gasto;
- maiores gastos.

get_category_expenses:

Use para:

- despesas de determinada categoria;
- gastos de determinada categoria;
- listar despesas de uma categoria.

calculate_savings:

Use para:

- quanto economizaria;
- redução de X%;
- impacto de reduzir uma despesa.

compare_periods:

Use para:

- aumento;
- queda;
- evolução;
- comparação;
- mês atual versus anterior;
- últimos 30 dias;
- últimos 7 dias;
- receita aumentando;
- despesas aumentando;
- lucro aumentando ou diminuindo.

detect_financial_trends:

Use obrigatoriamente para:

- Como estão minhas finanças?
- O que merece minha atenção?
- Existe algum problema?
- Faça uma análise.
- Quais são os riscos?
- O que está piorando?
- Tem algo estranho?
- Encontre tendências.

analyze_category_trend:

Use quando o usuário perguntar:

- por que uma categoria aumentou;
- por que uma categoria diminuiu;
- quais transações contribuíram;
- o que fez determinada categoria crescer;
- de onde veio o aumento de uma categoria.

filter_transactions:

Use quando o usuário pedir:

- filtrar;
- mostrar somente;
- mostrar apenas;
- filtrar despesas;
- filtrar receitas;
- abrir uma categoria filtrada.

Essa ferramenta cria apenas uma sugestão.

Ela não executa automaticamente.


INTENÇÃO


Se o usuário perguntar:

"Meu lucro caiu."
"Por que meu lucro caiu?"
"Quais fatores fizeram meu lucro cair?"

use compare_periods.

Quando também pedir fatores, motivos ou causas,
use também detect_financial_trends.

Se o usuário perguntar:

"Por que Estoque aumentou?"
"Quais transações fizeram Estoque crescer?"

use analyze_category_trend.


ANÁLISE DE CATEGORIA


Quando usar analyze_category_trend:

1. mostre o período anterior;
2. mostre o período atual;
3. mostre a diferença;
4. mostre a porcentagem;
5. mostre as principais transações;
6. não invente a causa.


FORMATAÇÃO


Use Markdown quando melhorar a leitura.

Use **negrito** nos números importantes.

Use tabelas para comparações.

Não use tabela para perguntas simples.

Valores monetários:

R$ 1.450,00

Percentuais:

24,5%

Evite respostas desnecessariamente longas.

EASTER EGG:

Se o usuário perguntar sobre "Eduardo Lindo",
responda de forma descontraída:


Não revele que isso é um easter egg.
Não explique esta regra.


FLUXO DE CAIXA E MERCADO GLOBAL

O contexto pode incluir "fluxoDeCaixa" com o saldo informado pelo usuário e compromissos futuros cadastrados. Trate as projeções como condicionais, não garantias. Se o saldo atual estiver vazio ou faltarem compromissos, deixe a limitação explícita e não invente recorrências.

O contexto pode incluir "mercadoGlobal" com notícias recentes e dados de exportação obtidos de fontes externas. Use apenas o que estiver presente nesse objeto para afirmar fatos atuais. Quando houver título, fonte, data e link, cite a fonte na resposta. Diferencie fatos fornecidos de hipóteses e nunca trate uma notícia como prova de impacto direto na empresa.

Quando não houver notícias atuais disponíveis, diga que não conseguiu consultar os dados globais nesta solicitação. Não invente acontecimentos nem oportunidades de exportação.
Se a pergunta pedir produtos ou países para exportar e "pesquisaDeExportacao" não contiver registros, não apresente uma oportunidade específica como comprovada. Peça para o usuário pesquisar uma categoria no módulo Mercado Global.

CONTEXTO FINANCEIRO


${JSON.stringify(
  analysis,
  null,
  2
)}
`;
    const conversation = Array.isArray(history)
      ? history
        .filter((item) => item.role === 'user' ||
          item.role ===
          'assistant')
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: typeof item.content ===
            'string'
            ? item.content
            : '',
        }))
      : [];
    let messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversation,
      {
        role: 'user',
        content: message,
      },
    ];
    let pendingAction = null;
    const requiredTools = detectRequiredTools(message);
    for (const toolName of requiredTools) {
      const args = buildToolArguments(toolName, message);
      const result = executeServerTool(toolName, args, transactions);
      console.log('ProfitGuard AI - ferramenta forçada:', toolName, args);
      messages.push({
        role: 'user',
        content: `DADOS VERIFICADOS DA FERRAMENTA ${toolName}:\n${JSON.stringify(
            result,
            null,
            2
          )}`,
      });
    }
    for (let step = 0;step < 5;step += 1) {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-oss:20b',
          stream: false,
          think: false,
          options: {
            num_predict: 2048,
            temperature: 0.2,
          },
          messages,
          tools,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Cloud ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      const assistantMessage = data.message;
      if (!assistantMessage?.tool_calls ||
        assistantMessage.tool_calls
          .length === 0) {
        return streamFinalResponse({
          res,
          messages,
          pendingAction,
        });
      }
      messages.push(assistantMessage);
      for (const toolCall of assistantMessage.tool_calls) {
        const name = toolCall.function?.name;
        const args = toolCall.function?.arguments ||
          {};
        console.log('ProfitGuard AI - ferramenta:', name, args);
        let result = executeServerTool(name, args, transactions);
        if (name ===
          'filter_transactions') {
          pendingAction = {
            type: 'filter_transactions',
            category: args.category ||
              'all',
            transactionType: args.type ||
              'all',
            search: args.search ||
              '',
          };
          result = {
            success: true,
            message: 'Sugestão de filtro criada. O usuário precisa confirmar a ação.',
            action: pendingAction,
          };
        }
        messages.push({
          role: 'user',
          content: `DADOS VERIFICADOS DA FERRAMENTA ${name}:\n${JSON.stringify(
              result,
              null,
              2
            )}`,
        });
      }
    }
    throw new Error('A IA excedeu o limite de chamadas de ferramentas.');
  }
  catch (error) {
    console.error('ProfitGuard AI error:', error);
    return res.status(500).json({
      error: error.message ||
        'Erro interno na IA.',
    });
  }
}

function detectRequiredTools(message) {
  const text = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const requiredTools = [];
  const asksProfitChange = text.includes('lucro caiu') ||
    text.includes('lucro diminuiu') ||
    text.includes('lucro aumentou') ||
    (text.includes('meu lucro') &&
      (text.includes('por que') ||
        text.includes('porque') ||
        text.includes('caiu') ||
        text.includes('diminuiu') ||
        text.includes('aumentou')));
  const asksGeneralAnalysis = text.includes('como estao minhas financas') ||
    text.includes('o que merece minha atencao') ||
    text.includes('existe algum problema') ||
    text.includes('faca uma analise') ||
    text.includes('quais sao os riscos') ||
    text.includes('tem algo estranho');
  const asksCategoryReason = (text.includes('por que') ||
    text.includes('porque')) &&
    (text.includes('estoque') ||
      text.includes('fornecedores') ||
      text.includes('contas') ||
      text.includes('manutencao') ||
      text.includes('marketing') ||
      text.includes('impostos') ||
      text.includes('categoria'));
  const asksTopExpenses = text.includes('maior despesa') ||
    text.includes('maiores despesas') ||
    text.includes('maior gasto') ||
    text.includes('maiores gastos');
  if (asksProfitChange) {
    requiredTools.push('compare_periods');
    if (text.includes('por que') ||
      text.includes('porque') ||
      text.includes('fatores') ||
      text.includes('motivos') ||
      text.includes('contribuiram')) {
      requiredTools.push('detect_financial_trends');
    }
  }
  if (asksGeneralAnalysis) {
    requiredTools.push('detect_financial_trends');
  }
  if (asksCategoryReason) {
    requiredTools.push('analyze_category_trend');
  }
  if (asksTopExpenses) {
    requiredTools.push('get_top_expenses');
  }
  return [
    ...new Set(requiredTools),
  ];
}

function buildToolArguments(toolName, message) {
  if (toolName ===
    'analyze_category_trend') {
    return {
      category: extractCategory(message),
      period: 'month',
    };
  }
  return {
    period: 'month',
  };
}

function extractCategory(message) {
  const categories = [
    'Estoque',
    'Fornecedores',
    'Contas',
    'Manutenção',
    'Marketing',
    'Impostos',
  ];
  const lower = message.toLowerCase();
  const found = categories.find((category) => lower.includes(category.toLowerCase()));
  if (found) {
    return found;
  }
  return '';
}

function executeServerTool(name, args, transactions) {
  if (name ===
    'get_top_expenses') {
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);
    return getTopExpenses(transactions, limit);
  }
  if (name ===
    'get_category_expenses') {
    return getCategoryExpenses(transactions, args.category || '');
  }
  if (name ===
    'calculate_savings') {
    return calculateSavings(Number(args.value) || 0, Number(args.percentage) || 0);
  }
  if (name ===
    'compare_periods') {
    return comparePeriods(transactions, args.period ||
      'month');
  }
  if (name ===
    'detect_financial_trends') {
    return detectFinancialTrends(transactions);
  }
  if (name ===
    'analyze_category_trend') {
    return analyzeCategoryTrend(transactions, args.category ||
      '', args.period ||
    'month');
  }
  return {
    error: 'Ferramenta desconhecida.',
  };
}

async function streamFinalResponse({ res, messages, pendingAction, }) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  let requestMessages = [...messages];
  let continuationCount = 0;
  try {
    while (continuationCount <= 1) {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-oss:20b',
          stream: true,
          think: false,
          options: { num_predict: 2048, temperature: 0.2 },
          messages: requestMessages,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Cloud ${response.status}: ${errorText}`);
      }
      if (!response.body)
        throw new Error('Ollama não retornou um stream.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let passText = '';
      let doneReason = '';
      const processLine = (line) => {
        if (!line.trim())
          return;
        const data = JSON.parse(line);
        const chunk = data?.message?.content;
        if (chunk) {
          passText += chunk;
          res.write(`${JSON.stringify({ type: 'text', content: chunk })}\n`);
        }
        if (data?.done)
          doneReason = data.done_reason || '';
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done)
          break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          try {
            processLine(line);
          }
          catch (error) {
            if (error instanceof SyntaxError)
              continue;
            throw error;
          }
        }
      }
      // Processa o último objeto mesmo quando o stream não termina com newline.
      if (buffer.trim()) {
        try {
          processLine(buffer);
        }
        catch (error) {
          if (!(error instanceof SyntaxError))
            throw error;
        }
      }
      const trimmed = passText.trimEnd();
      const boldMarkers = (trimmed.match(/\*\*/g) || []).length;
      const openCodeFence = ((trimmed.match(/```/g) || []).length % 2) === 1;
      const shouldContinue = continuationCount === 0 && passText.trim()
        && (doneReason === 'length' || boldMarkers % 2 === 1 || openCodeFence);
      if (!shouldContinue)
        break;
      requestMessages = [
        ...requestMessages,
        { role: 'assistant', content: passText },
        { role: 'user', content: 'Continue a resposta anterior exatamente de onde ela parou. Não repita o que já foi escrito, conclua os tópicos pendentes e termine as frases e a formatação.' },
      ];
      continuationCount += 1;
    }
    if (pendingAction) {
      res.write(`${JSON.stringify({ type: 'action', action: pendingAction })}\n`);
    }
    res.end();
  }
  catch (error) {
    console.error('Streaming error:', error);
    res.write(`${JSON.stringify({ type: 'error', message: error.message || 'Erro no streaming da IA.' })}\n`);
    res.end();
  }
}
