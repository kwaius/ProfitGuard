import {
  getTopExpenses,
  getCategoryExpenses,
  calculateSavings,
  comparePeriods,
  detectFinancialTrends,
  analyzeCategoryTrend,
} from '../src/ai/aiTools.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

let cachedGroqModels = null;

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
        required: ['value', 'percentage'],
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
            enum: ['month', '30days', '7days'],
            description:
              'month compara o mês atual com o anterior; 30days compara os últimos 30 dias com os 30 anteriores; 7days compara os últimos 7 dias com os 7 anteriores.',
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
      description:
        'Detecta tendências, aumento de despesas, queda de lucro, queda de margem e crescimento de categorias.',
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
      description:
        'Compara uma categoria entre períodos e mostra as principais transações que contribuíram para a mudança.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Categoria que será analisada.',
          },
          period: {
            type: 'string',
            enum: ['month', '30days', '7days'],
            description: 'Período da comparação.',
          },
        },
        required: ['category', 'period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filter_transactions',
      description:
        'Cria uma sugestão para filtrar as transações. A ação depende da confirmação do usuário.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Categoria desejada. Use "all" quando não houver filtro.',
          },
          type: {
            type: 'string',
            enum: ['income', 'expense', 'all'],
            description: 'Tipo da transação.',
          },
          search: {
            type: 'string',
            description: 'Texto da busca.',
          },
        },
        required: ['category', 'type', 'search'],
      },
    },
  },
];

async function getAvailableGroqModels(apiKey) {
  if (Array.isArray(cachedGroqModels) && cachedGroqModels.length > 0) {
    return cachedGroqModels;
  }

  const fallbackList = [
    process.env.GROQ_MODEL,
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-20b',
    'qwen/qwen3-32b',
  ].filter(Boolean);

  try {
    const response = await fetch(GROQ_MODELS_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return fallbackList;
    }

    const data = await response.json();
    const ids = (Array.isArray(data?.data) ? data.data : [])
      .map((item) => item.id)
      .filter(
        (id) =>
          typeof id === 'string' &&
          !/whisper|tts|playai|guard|orpheus|embed|moderation|compound/i.test(id)
      );

    if (ids.length === 0) {
      return fallbackList;
    }

    const scoreModel = (id) => {
      if (/llama-4|maverick|70b|120b/i.test(id)) return 1;
      if (/scout|qwen|gpt-oss|32b|20b/i.test(id)) return 2;
      if (/8b|instant/i.test(id)) return 3;
      return 4;
    };

    const sorted = [...ids].sort((a, b) => scoreModel(a) - scoreModel(b));
    cachedGroqModels = [...new Set([process.env.GROQ_MODEL, ...sorted].filter(Boolean))];
    return cachedGroqModels;
  } catch {
    return fallbackList;
  }
}

async function fetchGroqWithFallback(apiKey, payload) {
  const models = await getAvailableGroqModels(apiKey);
  let lastError = null;

  for (const model of models) {
    let response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...payload,
        model,
      }),
    });

    // Se recusar o formato de tools (400), tenta novamente sem tools no mesmo modelo
    if (!response.ok && response.status === 400 && payload.tools) {
      const { tools: _ignoredTools, tool_choice: _ignoredChoice, ...payloadWithoutTools } = payload;
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...payloadWithoutTools,
          model,
        }),
      });
    }

    if (response.ok) {
      return response;
    }

    const errorText = await response.text();
    lastError = new Error(`Groq (${model}) HTTP ${response.status}: ${errorText.slice(0, 140)}`);

    if (
      response.status === 404 ||
      response.status === 429 ||
      response.status === 400 ||
      response.status >= 500
    ) {
      console.warn(`Fallback Groq após ${model} (${response.status})`);
      continue;
    }

    throw lastError;
  }

  throw lastError || new Error('Nenhum modelo disponível respondeu na Groq.');
}

async function fetchGeminiBackup(geminiKey, systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;

  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Backup ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini Backup retornou resposta vazia.');
  }

  return text;
}

function sendNdjsonResponse(res, text, pendingAction = null) {
  if (!res.headersSent) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
  }
  res.write(`${JSON.stringify({ type: 'text', content: text })}\n`);
  if (pendingAction) {
    res.write(`${JSON.stringify({ type: 'action', action: pendingAction })}\n`);
  }
  res.end();
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

function buildEmergencyResponse(message, analysis, transactions, reason = '') {
  const text = String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const revenue = Number(analysis?.revenue || 0);
  const expenses = Number(analysis?.expenses || 0);
  const profit = Number(analysis?.profit ?? revenue - expenses);
  const margin = Number(analysis?.margin || 0);
  const diagnosticNote = reason ? `\n\n> ⚠️ *Diagnóstico: ${reason}*` : '';

  if (text.includes('maior despesa') || text.includes('maiores despesas')) {
    const top = getTopExpenses(transactions, 5);
    if (top.length > 0) {
      const list = top
        .map(
          (item, i) =>
            `${i + 1}. **${item.description || 'Despesa'}** (${item.category || 'Geral'}): **${formatBRL(item.value)}**`
        )
        .join('\n');
      return `📊 Aqui estão as suas maiores despesas registradas:\n\n${list}${diagnosticNote}`;
    }
  }

  if (text.includes('aumentaram') || text.includes('compar') || text.includes('lucro caiu')) {
    const comp = comparePeriods(transactions, 'month');
    if (!comp.error) {
      return (
        `📊 **Comparação do período atual com o anterior:**\n\n` +
        `- **Receita atual:** **${formatBRL(comp.current.revenue)}** (anterior: ${formatBRL(comp.previous.revenue)})\n` +
        `- **Despesas atuais:** **${formatBRL(comp.current.expenses)}** (anterior: ${formatBRL(comp.previous.expenses)})\n` +
        `- **Lucro atual:** **${formatBRL(comp.current.profit)}** (anterior: ${formatBRL(comp.previous.profit)})\n` +
        `- **Margem atual:** **${comp.current.margin.toFixed(1).replace('.', ',')}%**` +
        diagnosticNote
      );
    }
  }

  const trends = detectFinancialTrends(transactions);
  const alerts =
    Array.isArray(trends?.alerts) && trends.alerts.length > 0
      ? trends.alerts.map((a) => `- 🟡 ${a.message}`).join('\n')
      : Array.isArray(analysis?.alerts) && analysis.alerts.length > 0
        ? analysis.alerts.map((a) => `- 🟡 ${a.message}`).join('\n')
        : '- 🟢 Nenhum alerta crítico detectado nos lançamentos atuais.';

  return (
    `📊 **Resumo das suas finanças:**\n\n` +
    `- **Receita:** **${formatBRL(revenue)}**\n` +
    `- **Despesas:** **${formatBRL(expenses)}**\n` +
    `- **Lucro:** **${formatBRL(profit)}**\n` +
    `- **Margem:** **${margin.toFixed(1).replace('.', ',')}%**\n\n` +
    `**Pontos de atenção:**\n${alerts}` +
    diagnosticNote
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }

  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  const { message, analysis, transactions = [], history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
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
- Groq;
- Gemini;
- Llama;
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

${JSON.stringify(analysis)}
`;

  const conversation = Array.isArray(history)
    ? history
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .slice(-4)
        .map((item) => ({
          role: item.role,
          content: typeof item.content === 'string' ? item.content : '',
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
    messages.push({
      role: 'user',
      content: `DADOS VERIFICADOS DA FERRAMENTA ${toolName}: ${JSON.stringify(result)}`,
    });
  }

  try {
    if (!groqKey) {
      throw new Error('Variável GROQ_API_KEY não encontrada na Vercel (faça Redeploy após salvar).');
    }

    for (let step = 0; step < 5; step += 1) {
      const response = await fetchGroqWithFallback(groqKey, {
        stream: false,
        max_tokens: 2048,
        temperature: 0.2,
        messages,
        tools,
        tool_choice: 'auto',
      });

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message;

      if (!assistantMessage?.tool_calls || assistantMessage.tool_calls.length === 0) {
        return await streamFinalResponse({
          res,
          messages,
          pendingAction,
          groqKey,
          geminiKey,
          systemPrompt,
          analysis,
          transactions,
          originalMessage: message,
        });
      }

      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const name = toolCall.function?.name;
        let args = {};
        if (typeof toolCall.function?.arguments === 'string') {
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }
        } else if (toolCall.function?.arguments) {
          args = toolCall.function.arguments;
        }

        let result = executeServerTool(name, args, transactions);

        if (name === 'filter_transactions') {
          pendingAction = {
            type: 'filter_transactions',
            category: args.category || 'all',
            transactionType: args.type || 'all',
            search: args.search || '',
          };
          result = {
            success: true,
            message: 'Sugestão de filtro criada. O usuário precisa confirmar a ação.',
            action: pendingAction,
          };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name,
          content: JSON.stringify(result),
        });
      }
    }

    throw new Error('Limite de chamadas de ferramentas atingido.');
  } catch (primaryError) {
    console.warn('Acionando backup após erro na rota principal:', primaryError.message);

    if (geminiKey) {
      try {
        const backupText = await fetchGeminiBackup(geminiKey, systemPrompt, messages);
        return sendNdjsonResponse(res, backupText, pendingAction);
      } catch (geminiError) {
        console.warn('Backup Gemini também falhou:', geminiError.message);
      }
    }

    const emergencyText = buildEmergencyResponse(
      message,
      analysis,
      transactions,
      primaryError.message
    );
    return sendNdjsonResponse(res, emergencyText, pendingAction);
  }
}

function detectRequiredTools(message) {
  const text = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const requiredTools = [];

  const asksProfitChange =
    text.includes('lucro caiu') ||
    text.includes('lucro diminuiu') ||
    text.includes('lucro aumentou') ||
    (text.includes('meu lucro') &&
      (text.includes('por que') ||
        text.includes('porque') ||
        text.includes('caiu') ||
        text.includes('diminuiu') ||
        text.includes('aumentou')));

  const asksGeneralAnalysis =
    text.includes('como estao minhas financas') ||
    text.includes('o que merece minha atencao') ||
    text.includes('existe algum problema') ||
    text.includes('faca uma analise') ||
    text.includes('quais sao os riscos') ||
    text.includes('tem algo estranho');

  const asksCategoryReason =
    (text.includes('por que') || text.includes('porque')) &&
    (text.includes('estoque') ||
      text.includes('fornecedores') ||
      text.includes('contas') ||
      text.includes('manutencao') ||
      text.includes('marketing') ||
      text.includes('impostos') ||
      text.includes('categoria'));

  const asksTopExpenses =
    text.includes('maior despesa') ||
    text.includes('maiores despesas') ||
    text.includes('maior gasto') ||
    text.includes('maiores gastos');

  if (asksProfitChange) {
    requiredTools.push('compare_periods');
    if (
      text.includes('por que') ||
      text.includes('porque') ||
      text.includes('fatores') ||
      text.includes('motivos') ||
      text.includes('contribuiram')
    ) {
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

  return [...new Set(requiredTools)];
}

function buildToolArguments(toolName, message) {
  if (toolName === 'analyze_category_trend') {
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
  if (name === 'get_top_expenses') {
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);
    return getTopExpenses(transactions, limit);
  }
  if (name === 'get_category_expenses') {
    return getCategoryExpenses(transactions, args.category || '');
  }
  if (name === 'calculate_savings') {
    return calculateSavings(Number(args.value) || 0, Number(args.percentage) || 0);
  }
  if (name === 'compare_periods') {
    return comparePeriods(transactions, args.period || 'month');
  }
  if (name === 'detect_financial_trends') {
    return detectFinancialTrends(transactions);
  }
  if (name === 'analyze_category_trend') {
    return analyzeCategoryTrend(transactions, args.category || '', args.period || 'month');
  }
  return {
    error: 'Ferramenta desconhecida.',
  };
}

async function streamFinalResponse({
  res,
  messages,
  pendingAction,
  groqKey,
  geminiKey,
  systemPrompt,
  analysis,
  transactions,
  originalMessage,
}) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let requestMessages = [...messages];
  let continuationCount = 0;
  let totalWritten = '';

  try {
    while (continuationCount <= 1) {
      const response = await fetchGroqWithFallback(groqKey, {
        stream: true,
        max_tokens: 2048,
        temperature: 0.2,
        messages: requestMessages,
      });

      if (!response.body) {
        throw new Error('A IA não retornou um stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let passText = '';
      let doneReason = '';

      const processLine = (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data:')) return;

        const payload = trimmedLine.replace(/^data:\s*/, '');
        if (payload === '[DONE]') return;

        const data = JSON.parse(payload);
        const choice = data?.choices?.[0];
        const chunk = choice?.delta?.content;

        if (chunk) {
          passText += chunk;
          totalWritten += chunk;
          res.write(`${JSON.stringify({ type: 'text', content: chunk })}\n`);
        }

        if (choice?.finish_reason) {
          doneReason = choice.finish_reason;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          try {
            processLine(line);
          } catch (error) {
            if (error instanceof SyntaxError) continue;
            throw error;
          }
        }
      }

      if (buffer.trim()) {
        try {
          processLine(buffer);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      }

      const trimmed = passText.trimEnd();
      const boldMarkers = (trimmed.match(/\*\*/g) || []).length;
      const openCodeFence = (trimmed.match(/```/g) || []).length % 2 === 1;
      const shouldContinue =
        continuationCount === 0 &&
        passText.trim() &&
        (doneReason === 'length' || boldMarkers % 2 === 1 || openCodeFence);

      if (!shouldContinue) break;

      requestMessages = [
        ...requestMessages,
        { role: 'assistant', content: passText },
        {
          role: 'user',
          content:
            'Continue a resposta anterior exatamente de onde ela parou. Não repita o que já foi escrito, conclua os tópicos pendentes e termine as frases e a formatação.',
        },
      ];
      continuationCount += 1;
    }

    if (pendingAction) {
      res.write(`${JSON.stringify({ type: 'action', action: pendingAction })}\n`);
    }

    res.end();
  } catch (error) {
    console.warn('Streaming fallback acionado:', error.message);
    if (!totalWritten.trim()) {
      let fallbackText = '';
      if (geminiKey) {
        try {
          fallbackText = await fetchGeminiBackup(geminiKey, systemPrompt, messages);
        } catch {
          fallbackText = '';
        }
      }
      if (!fallbackText) {
        fallbackText = buildEmergencyResponse(
          originalMessage,
          analysis,
          transactions,
          error.message
        );
      }
      res.write(`${JSON.stringify({ type: 'text', content: fallbackText })}\n`);
      if (pendingAction) {
        res.write(`${JSON.stringify({ type: 'action', action: pendingAction })}\n`);
      }
    }
    res.end();
  }
}