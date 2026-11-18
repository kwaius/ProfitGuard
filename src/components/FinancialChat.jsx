import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  getTopExpenses,
  getCategoryExpenses,
  calculateSavings,
  comparePeriods,
  detectFinancialTrends,
  analyzeCategoryTrend,
} from '../ai/aiTools';

const defaultMessage = {
  id: 1,
  role: 'assistant',
  content:
    '👋 Fala! Eu sou o **ProfitGuard AI**. Posso analisar suas finanças, explicar seus números e ajudar você a entender melhor o seu negócio.',
};

let messageIdCounter = 0;

function createMessageId() {
  messageIdCounter += 1;
  return `${Date.now()}-${messageIdCounter}`;
}

function isEduardoLindoQuestion(text) {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );

  return normalized.includes(
    'eduardo lindo'
  );
}

function normalizePromptText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function sanitizeSavedMessages(savedMessages) {
  if (!Array.isArray(savedMessages)) return [defaultMessage];

  return savedMessages.map((item) => {
    if (item?.role !== 'user' || typeof item.content !== 'string') return item;
    const content = item.content;

    // Prompts internos de análise não devem aparecer como mensagens enormes no histórico.
    const looksLikeInternalAnalysis = content.includes('Resumo financeiro do histórico carregado:')
      || (content.length > 900 && (content.includes('Categoria inicial do sinal:') || content.includes('Pesquisa:') || content.includes('UN Comtrade')));

    if (looksLikeInternalAnalysis) {
      if (/Pesquisa:|UN Comtrade|pesquisa de exporta[cç][aã]o/i.test(content)) {
        return { ...item, content: 'Analise a pesquisa de exportação para a minha empresa.' };
      }
      return { ...item, content: 'Analise o possível impacto de uma notícia internacional para a minha empresa.' };
    }

    return item;
  });
}

function getFriendlyAIError(error) {
  const detail = String(error?.message || '');

  if (import.meta.env.DEV && /model.*not found|not found.*model/i.test(detail)) {
    return '🔴 O modelo local do ProfitGuard não está instalado no Ollama. Abra outro terminal e execute: ollama pull qwen3.5:4b. Depois tente enviar a pergunta novamente.';
  }

  if (import.meta.env.DEV && /failed to fetch|fetch failed|networkerror|err_connection_refused|econnrefused/i.test(detail)) {
    return '🔴 Não consegui acessar o Ollama local. Deixe o Vite rodando e abra outro terminal; execute `ollama run qwen3.5:4b --think=false` e mantenha esse terminal aberto. Depois tente novamente.';
  }

  if (import.meta.env.DEV && /ollama local (401|403)/i.test(detail)) {
    return '🔴 O Ollama respondeu, mas recusou a solicitação. Confira se o serviço local está funcionando e se o modelo qwen3.5:4b está disponível.';
  }

  return '🔴 Não consegui processar essa pergunta agora. Verifique a conexão com o serviço de IA e tente novamente.';
}

async function addMarketContextIfNeeded(message, analysis) {
  const normalized = normalizePromptText(message);
  const marketTerms = [
    'mundo', 'mundial', 'global', 'crise', 'crises', 'internacional',
    'export', 'exterior', 'cambio', 'dolar', 'guerra', 'petroleo',
    'tarifa', 'inflacao', 'import', 'mercado global', 'paises',
    'comercio exterior', 'comercio internacional',
    'como estao minhas financas', 'o que merece minha atencao',
    'faca uma analise', 'quais sao os riscos', 'existe algum problema',
    'o que posso melhorar', 'por que meu lucro', 'minhas despesas aumentaram',
    'minha receita caiu', 'estoque aumentou', 'estoque cresceu',
  ];

  if (!marketTerms.some((term) => normalized.includes(term))) {
    return analysis;
  }

  const knownProducts = [
    'cafe', 'cacau', 'chocolate', 'soja', 'mel', 'carne bovina',
    'calcados', 'sapato', 'tenis', 'camiseta', 'camisetas', 'camisa', 'cosmeticos', 'maquiagem',
    'roupa', 'vestuario', 'fruta', 'manga', 'uva', 'banana',
    'acucar', 'maquinas', 'eletronicos', 'eletronica',
  ];
  const product = knownProducts.find((item) => normalized.includes(item));

  try {
    const params = new URLSearchParams();
    if (product) params.set('product', product);
    const response = await fetch(`/api/market${params.toString() ? `?${params}` : ''}`);
    if (!response.ok) throw new Error('A API do Mercado Global não está disponível.');

    const data = await response.json();
    const marketContext = {
      atualizadoEm: data.updatedAt || null,
      fonteDeNoticias: 'GDELT Project',
      erroDeNoticias: data.eventsError || null,
      acontecimentosRecentes: (Array.isArray(data.events) ? data.events : []).slice(0, 6).map((article) => ({
        titulo: article.title,
        fonte: article.source,
        data: article.date,
        link: article.url,
      })),
      pesquisaDeExportacao: data.exportResearch || null,
      erroDeExportacao: data.exportError || null,
    };

    localStorage.setItem('profitguard-global-market-cache', JSON.stringify(marketContext));
    return { ...analysis, mercadoGlobal: marketContext };
  } catch (error) {
    console.warn('ProfitGuard AI: não foi possível carregar contexto global.', error);
    return {
      ...analysis,
      mercadoGlobal: {
        erro: 'Os dados globais atuais não puderam ser consultados nesta solicitação. Não faça afirmações sobre acontecimentos atuais sem fonte disponível.',
        pesquisaDeExportacao: null,
        acontecimentosRecentes: [],
      },
    };
  }
}

function FinancialChat({
  analysis,
  transactions = [],
}) {
  const navigate = useNavigate();

  const chatRef = useRef(null);
  const sendMessageRef = useRef(null);

  const [messages, setMessages] =
    useState(() => {
      const savedMessages =
        localStorage.getItem(
          'profitguard-ai-messages'
        );

      if (savedMessages) {
        try {
          const parsedMessages =
            JSON.parse(savedMessages);

          if (
            Array.isArray(
              parsedMessages
            ) &&
            parsedMessages.length > 0
          ) {
            return sanitizeSavedMessages(parsedMessages);
          }
        } catch {
          return [defaultMessage];
        }
      }

      return [defaultMessage];
    });

  const [input, setInput] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    localStorage.setItem(
      'profitguard-ai-messages',
      JSON.stringify(messages)
    );
  }, [messages]);

  useEffect(() => {
    const handleInvestigateEvent =
      (event) => {
        const prompt = event.detail?.prompt;

        if (!prompt || !sendMessageRef.current) return;

        chatRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        sendMessageRef.current(prompt);
      };

    window.addEventListener(
      'profitguard-ai-investigate',
      handleInvestigateEvent
    );

    // Outros módulos podem guardar uma pergunta antes de navegar para o Dashboard.
    const storedPendingPrompt = localStorage.getItem('profitguard-ai-pending-prompt');
    if (storedPendingPrompt) {
      localStorage.removeItem('profitguard-ai-pending-prompt');
      let pendingPrompt = { prompt: storedPendingPrompt };
      try {
        const parsed = JSON.parse(storedPendingPrompt);
        if (parsed && typeof parsed.prompt === 'string') pendingPrompt = parsed;
      } catch {
        // Compatibilidade com prompts salvos pela versão anterior como texto puro.
      }
      window.setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        sendMessageRef.current?.(pendingPrompt.prompt, {
          displayContent: pendingPrompt.displayContent,
        });
      }, 100);
    }

    return () => {
      window.removeEventListener(
        'profitguard-ai-investigate',
        handleInvestigateEvent
      );
    };
  }, []);

  const suggestions = [
    'Como estão minhas finanças?',
    'O que merece minha atenção?',
    'Minhas despesas aumentaram?',
    'Qual é minha maior despesa?',
    'Como está meu fluxo de caixa?',
    'Há alguma crise mundial que pode afetar meu negócio?',
  ];

  const handleSendMessage = async (
    message = input,
    options = {}
  ) => {
    const text =
      String(message ?? '').trim();

    const displayContent =
      typeof options.displayContent === 'string' && options.displayContent.trim()
        ? options.displayContent.trim()
        : text;

    if (
      !text ||
      loading
    ) {
      return;
    }

    setError('');

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      content: displayContent,
    };

    const assistantId = createMessageId();

    if (
      isEduardoLindoQuestion(
        text
      )
    ) {
      setMessages(
        (currentMessages) => [
          ...currentMessages,

          userMessage,

          {
            id: assistantId,
            role: 'assistant',

            content:
              '👀 **Eduardo Lindo?** Esse nome dispensa apresentações... uma verdadeira lenda do ProfitGuard. 😂',

            image:
              '/eduardo-lindo.png',
          },
        ]
      );

      setInput('');

      return;
    }

    const historyForRequest = [
      ...messages,
      userMessage,
    ];

    setMessages(
      (currentMessages) => [
        ...currentMessages,

        userMessage,

        {
          id: assistantId,
          role: 'assistant',
          content: '',
        },
      ]
    );

    setInput('');
    setLoading(true);

    try {
      const analysisForRequest = await addMarketContextIfNeeded(text, analysis);

      const result =
        await askAI({
          message: text,
          analysis: analysisForRequest,
          transactions,
          history:
            historyForRequest,

          onChunk: (chunk) => {
            setMessages(
              (currentMessages) =>
                currentMessages.map(
                  (item) =>
                    item.id ===
                      assistantId
                      ? {
                        ...item,

                        content:
                          item.content +
                          chunk,
                      }
                      : item
                )
            );
          },
        });

      setMessages(
        (currentMessages) =>
          currentMessages.map(
            (item) =>
              item.id ===
                assistantId
                ? {
                  ...item,

                  content:
                    result.message ||
                    item.content ||
                    '',

                  action:
                    result.action ||
                    null,
                }
                : item
          )
      );
    } catch (
    requestError
    ) {
      console.error(
        'FinancialChat error:',
        requestError
      );

      const friendlyError = getFriendlyAIError(requestError);
      setError(friendlyError.replace(/^🔴\s*/, ''));

      setMessages(
        (currentMessages) =>
          currentMessages.map(
            (item) =>
              item.id === assistantId
                ? {
                  ...item,
                  content: friendlyError,
                  error: true,
                }
                : item
          )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendMessageRef.current = handleSendMessage;
  });

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    handleSendMessage();
  };

  const handleApplyAction =
    (action) => {
      if (!action) {
        return;
      }

      if (
        action.type ===
        'filter_transactions'
      ) {
        const params =
          new URLSearchParams();

        if (
          action.category &&
          action.category !==
          'all'
        ) {
          params.set(
            'category',
            action.category
          );
        }

        if (
          action.transactionType &&
          action.transactionType !==
          'all'
        ) {
          params.set(
            'type',
            action.transactionType
          );
        }

        if (action.search) {
          params.set(
            'search',
            action.search
          );
        }

        const query =
          params.toString();

        navigate(
          query
            ? `/transacoes?${query}`
            : '/transacoes'
        );
      }
    };

  const handleRemoveAction =
    (messageId) => {
      setMessages(
        (currentMessages) =>
          currentMessages.map(
            (item) =>
              item.id ===
                messageId
                ? {
                  ...item,
                  action: null,
                }
                : item
          )
      );
    };

  const handleClearChat =
    () => {
      const confirmed =
        window.confirm(
          'Deseja apagar todo o histórico da conversa?'
        );

      if (!confirmed) {
        return;
      }

      setMessages([
        defaultMessage,
      ]);

      localStorage.removeItem(
        'profitguard-ai-messages'
      );
    };

  return (
    <section
      ref={chatRef}
      className="financial-chat"
    >
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-avatar">
            🤖
          </div>
          <div>
            <h2>
              ProfitGuard AI
            </h2>
            <p>
              Assistente financeiro inteligente
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <div className="ai-status">
            <span className="ai-status-dot"></span>
            {loading
              ? 'Analisando'
              : 'Online'}
          </div>
          <button
            type="button"
            className="clear-chat-button"
            onClick={
              handleClearChat
            }
            disabled={loading}
          >
            Limpar conversa
          </button>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map(
          (message) => (
            <div
              key={message.id}
              className={`chat-message ${
                message.role ===
                'user'
                  ? 'user-message'
                  : 'assistant-message'
              }`}
            >
              {message.role ===
                'assistant' && (
                  <div className="message-avatar">
                    🤖
                  </div>
                )}
              <div
                className={`message-bubble ${
                  message.error
                    ? 'message-error'
                    : ''
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                >
                  {message.content}
                </ReactMarkdown>
                {message.image && (
                  <img
                    src={message.image}
                    alt="Eduardo Lindo"
                    className="ai-easter-egg-image"
                  />
                )}
                {message.action && (
                  <div className="ai-action-card">
                    <div className="ai-action-title">
                      ⚡ Ação sugerida
                    </div>
                    <p>
                      Deseja aplicar este filtro
                      às suas transações?
                    </p>
                    <div className="ai-action-buttons">
                      <button
                        type="button"
                        className="ai-action-confirm"
                        onClick={() =>
                          handleApplyAction(
                            message.action
                          )
                        }
                      >
                        Aplicar filtro
                      </button>
                      <button
                        type="button"
                        className="ai-action-cancel"
                        onClick={() =>
                          handleRemoveAction(
                            message.id
                          )
                        }
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {loading && (
          <div className="chat-message assistant-message">
            <div className="message-avatar">
              🤖
            </div>
            <div className="message-bubble typing-bubble">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      {!loading && (
        <div className="chat-suggestions">
          {suggestions.map(
            (suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  handleSendMessage(
                    suggestion
                  )
                }
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      )}
      <form
        className="chat-input-area"
        onSubmit={
          handleSubmit
        }
      >
        <input
          type="text"
          value={input}
          placeholder="Pergunte sobre suas finanças..."
          onChange={(event) =>
            setInput(
              event.target.value
            )
          }
          disabled={loading}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={
            loading ||
            !input.trim()
          }
        >
          ➤
        </button>
      </form>
      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}
    </section>
  );
}

async function askAI({
  message,
  analysis,
  transactions,
  history,
  onChunk,
}) {
  if (
    !import.meta.env.DEV
  ) {
    return streamProductionAI({
      message,
      analysis,
      transactions,
      history,
      onChunk,
    });
  }

  return runLocalAI({
    message,
    analysis,
    transactions,
    history,
    onChunk,
  });
}

const localTools = [
  {
    type: 'function',

    function: {
      name:
        'get_top_expenses',

      description:
        'Retorna as maiores despesas do usuário.',

      parameters: {
        type: 'object',

        properties: {
          limit: {
            type: 'integer',
          },
        },

        required: [],
      },
    },
  },

  {
    type: 'function',

    function: {
      name:
        'get_category_expenses',

      description:
        'Retorna as despesas de uma categoria.',

      parameters: {
        type: 'object',

        properties: {
          category: {
            type: 'string',
          },
        },

        required: [
          'category',
        ],
      },
    },
  },

  {
    type: 'function',

    function: {
      name:
        'calculate_savings',

      description:
        'Calcula uma economia percentual.',

      parameters: {
        type: 'object',

        properties: {
          value: {
            type: 'number',
          },

          percentage: {
            type: 'number',
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
      name:
        'compare_periods',

      description:
        'Compara períodos financeiros.',

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
          },
        },

        required: [
          'period',
        ],
      },
    },
  },

  {
    type: 'function',

    function: {
      name:
        'detect_financial_trends',

      description:
        'Detecta tendências e riscos financeiros.',

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
      name:
        'analyze_category_trend',

      description:
        'Analisa por que uma categoria aumentou ou diminuiu e mostra as principais transações.',

      parameters: {
        type: 'object',

        properties: {
          category: {
            type: 'string',
          },

          period: {
            type: 'string',

            enum: [
              'month',
              '30days',
              '7days',
            ],
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
      name:
        'filter_transactions',

      description:
        'Cria uma sugestão para filtrar transações.',

      parameters: {
        type: 'object',

        properties: {
          category: {
            type: 'string',
          },

          type: {
            type: 'string',

            enum: [
              'income',
              'expense',
              'all',
            ],
          },

          search: {
            type: 'string',
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

function buildLocalPrompt(
  analysis
) {
  return `
Você é o ProfitGuard AI.

IDENTIDADE:

Seu nome é ProfitGuard AI.

Você é o assistente de inteligência artificial
integrado ao sistema ProfitGuard.

Neste ambiente você está executando localmente.

Se perguntarem "quem fez você?",
responda:

"Sou o ProfitGuard AI, a inteligência artificial
integrada ao sistema ProfitGuard."

Não mencione OpenAI, Ollama, Qwen ou detalhes
de infraestrutura, a menos que o usuário pergunte
especificamente sobre tecnologia.

EASTER EGG:

Se o usuário perguntar sobre Eduardo Lindo,
responda de forma descontraída e divertida.

Não explique que existe um easter egg.


PERSONALIDADE


- inteligente;
- amigável;
- confiante;
- objetiva;
- didática;
- parceira;
- levemente descontraída;
- profissional.

Fale em português brasileiro natural.


REGRA ABSOLUTA


Nunca invente dados.

Nunca invente causas.

Nunca use benchmarks sem dados fornecidos.

Nunca diga que algo é saudável, normal, excelente,
perfeito ou controlado sem evidência.

Se não houver dados suficientes:

"Não tenho dados suficientes para afirmar isso."

Lucro = Receita - Despesas.

Chame esse resultado apenas de "Lucro".


FERRAMENTAS


get_top_expenses:
maiores despesas.

get_category_expenses:
despesas por categoria.

calculate_savings:
economia.

compare_periods:
aumento, queda, evolução e comparação.

detect_financial_trends:
análise geral e pontos de atenção.

analyze_category_trend:
mudanças de categoria e transações envolvidas.

filter_transactions:
filtros.


INTENÇÃO


"meu lucro caiu"
"por que meu lucro caiu"
"meu lucro diminuiu"

→ use compare_periods.

Se perguntar por fatores, motivos ou causas:

→ use detect_financial_trends.

"por que Estoque aumentou"
"quais transações fizeram Estoque crescer"

→ use analyze_category_trend.

"como estão minhas finanças?"
"o que merece minha atenção?"
"existe algum problema?"

→ use detect_financial_trends.

Nunca invente a causa de uma mudança.


FORMATAÇÃO


Use Markdown.

Use **negrito** para números importantes.

Use tabelas somente quando houver comparação.

Valores:

R$ 1.450,00

Percentuais:

24,5%

FLUXO DE CAIXA E MERCADO GLOBAL:

O contexto pode incluir "fluxoDeCaixa" com o saldo informado pelo usuário e compromissos futuros cadastrados. Use esses números como projeções condicionais, não como garantias. Se o saldo atual estiver vazio ou faltarem compromissos, deixe essa limitação explícita e não invente recorrências.

O contexto pode incluir "mercadoGlobal" com notícias recentes e dados de exportação obtidos de fontes externas. Use apenas o que estiver presente nesse objeto para afirmar fatos atuais. Quando houver título, fonte, data e link, cite a fonte na resposta. Diferencie fatos fornecidos de hipóteses e nunca trate uma notícia como prova de impacto direto na empresa.

Quando não houver notícias atuais disponíveis, diga que não conseguiu consultar os dados globais nesta solicitação. Não invente acontecimentos nem oportunidades de exportação.
Se a pergunta pedir produtos ou países para exportar e "pesquisaDeExportacao" não contiver registros, não apresente uma oportunidade específica como comprovada. Peça para o usuário pesquisar uma categoria no módulo Mercado Global.

CONTEXTO FINANCEIRO:

${JSON.stringify(
  analysis,
  null,
  2
)}
`;
}

function buildConversation(
  history
) {
  return Array.isArray(history)
    ? history
      .filter(
        (item) =>
          item.role === 'user' ||
          item.role ===
          'assistant'
      )
      .slice(-10)
      .map((item) => ({
        role: item.role,

        content:
          typeof item.content ===
            'string'
            ? item.content
            : '',
      }))
    : [];
}

function detectRequiredTools(
  message
) {
  const text =
    message
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

  const requiredTools = [];

  const asksProfitChange =
    text.includes(
      'lucro caiu'
    ) ||
    text.includes(
      'lucro diminuiu'
    ) ||
    text.includes(
      'lucro aumentou'
    ) ||
    text.includes(
      'lucro melhorou'
    ) ||
    (
      text.includes(
        'meu lucro'
      ) &&
      (
        text.includes('por que') ||
        text.includes('porque') ||
        text.includes('mudou') ||
        text.includes('caiu') ||
        text.includes('diminuiu') ||
        text.includes('aumentou')
      )
    );

  const asksGeneralAnalysis =
    text.includes(
      'como estao minhas financas'
    ) ||
    text.includes(
      'o que merece minha atencao'
    ) ||
    text.includes(
      'existe algum problema'
    ) ||
    text.includes(
      'faca uma analise'
    ) ||
    text.includes(
      'tem alguma coisa errada'
    ) ||
    text.includes(
      'quais sao os riscos'
    );

  const asksCategoryReason =
    (
      text.includes('por que') ||
      text.includes('porque')
    ) &&
    (
      text.includes('categoria') ||
      text.includes('estoque') ||
      text.includes('fornecedores') ||
      text.includes('contas') ||
      text.includes('manutencao') ||
      text.includes('marketing') ||
      text.includes('impostos')
    );

  const asksTopExpenses =
    text.includes(
      'maior despesa'
    ) ||
    text.includes(
      'maiores despesas'
    ) ||
    text.includes(
      'maior gasto'
    ) ||
    text.includes(
      'maiores gastos'
    );

  if (asksProfitChange) {
    requiredTools.push(
      'compare_periods'
    );

    if (
      text.includes('por que') ||
      text.includes('porque') ||
      text.includes('fatores') ||
      text.includes('contribuiram') ||
      text.includes('motivos')
    ) {
      requiredTools.push(
        'detect_financial_trends'
      );
    }
  }

  if (asksGeneralAnalysis) {
    requiredTools.push(
      'detect_financial_trends'
    );
  }

  if (asksCategoryReason) {
    requiredTools.push(
      'analyze_category_trend'
    );
  }

  if (asksTopExpenses) {
    requiredTools.push(
      'get_top_expenses'
    );
  }

  return [
    ...new Set(
      requiredTools
    ),
  ];
}

function executeLocalTool(
  name,
  args,
  transactions
) {
  if (
    name ===
    'get_top_expenses'
  ) {
    const limit =
      Math.min(
        Math.max(
          Number(
            args.limit
          ) || 5,
          1
        ),
        10
      );

    return getTopExpenses(
      transactions,
      limit
    );
  }

  if (
    name ===
    'get_category_expenses'
  ) {
    return getCategoryExpenses(
      transactions,
      args.category || ''
    );
  }

  if (
    name ===
    'calculate_savings'
  ) {
    return calculateSavings(
      Number(
        args.value
      ) || 0,

      Number(
        args.percentage
      ) || 0
    );
  }

  if (
    name ===
    'compare_periods'
  ) {
    return comparePeriods(
      transactions,
      args.period || 'month'
    );
  }

  if (
    name ===
    'detect_financial_trends'
  ) {
    return detectFinancialTrends(
      transactions
    );
  }

  if (
    name ===
    'analyze_category_trend'
  ) {
    return analyzeCategoryTrend(
      transactions,

      args.category || '',

      args.period || 'month'
    );
  }

  return {
    error:
      'Ferramenta desconhecida.',
  };
}

async function runLocalAI({
  message,
  analysis,
  transactions,
  history,
  onChunk,
}) {
  const systemPrompt =
    buildLocalPrompt(
      analysis
    );

  const conversation =
    buildConversation(
      history
    );

  let messages = [
    {
      role: 'system',
      content:
        systemPrompt,
    },

    ...conversation,

    {
      role: 'user',
      content: message,
    },
  ];

  let pendingAction = null;

  const requiredTools =
    detectRequiredTools(
      message
    );

  for (
    const toolName of
    requiredTools
  ) {
    let args = {
      period: 'month',
    };

    if (
      toolName ===
      'analyze_category_trend'
    ) {
      args = {
        category:
          extractCategory(
            message
          ),

        period:
          'month',
      };
    }

    const result =
      executeLocalTool(
        toolName,
        args,
        transactions
      );

    console.log(
      'ProfitGuard AI - ferramenta forçada:',
      toolName,
      args
    );

    messages.push({
      role: 'user',

      content:
        `DADOS VERIFICADOS DA FERRAMENTA ${toolName}:\n${JSON.stringify(
          result,
          null,
          2
        )}`,
    });
  }

  for (
    let step = 0;
    step < 5;
    step += 1
  ) {
    const response =
      await fetch(
        'http://localhost:11434/api/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              model:
                'qwen3.5:4b',

              stream:
                false,

              think:
                false,

              messages,

              tools:
                localTools,
            }),
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Ollama local ${response.status}: ${errorText}`
      );
    }

    const data =
      await response.json();

    const assistantMessage =
      data.message;

    if (
      !assistantMessage?.tool_calls ||
      assistantMessage.tool_calls
        .length === 0
    ) {
      return streamLocalFinalAI({
        messages,
        pendingAction,
        onChunk,
      });
    }

    messages.push(
      assistantMessage
    );

    for (
      const toolCall of
      assistantMessage.tool_calls
    ) {
      const name =
        toolCall.function?.name;

      const args =
        toolCall.function?.arguments ||
        {};

      console.log(
        'ProfitGuard AI - ferramenta:',
        name,
        args
      );

      const result =
        executeLocalTool(
          name,
          args,
          transactions
        );

      if (
        name ===
        'filter_transactions'
      ) {
        pendingAction = {
          type:
            'filter_transactions',

          category:
            args.category ||
            'all',

          transactionType:
            args.type ||
            'all',

          search:
            args.search ||
            '',
        };
      }

      messages.push({
        role: 'user',

        content:
          `DADOS VERIFICADOS DA FERRAMENTA ${name}:\n${JSON.stringify(
            result,
            null,
            2
          )}`,
      });
    }
  }

  throw new Error(
    'A IA excedeu o limite de chamadas de ferramentas.'
  );
}

function extractCategory(
  message
) {
  const categories = [
    'Estoque',
    'Fornecedores',
    'Contas',
    'Manutenção',
    'Marketing',
    'Impostos',
  ];

  const lower =
    message.toLowerCase();

  const found =
    categories.find(
      (category) =>
        lower.includes(
          category.toLowerCase()
        )
    );

  if (found) {
    return found;
  }

  const match =
    message.match(
      /categoria\s+([a-záàâãéêíóôõúç\s]+)/i
    );

  if (match) {
    return match[1].trim();
  }

  return '';
}

async function streamLocalFinalAI({
  messages,
  pendingAction,
  onChunk,
}) {
  let fullText = '';
  let requestMessages = [...messages];
  let continuationCount = 0;

  while (continuationCount <= 1) {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:4b',
        stream: true,
        think: false,
        options: { num_predict: 2048, temperature: 0.2 },
        messages: requestMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama local ${response.status}: ${errorText}`);
    }
    if (!response.body) throw new Error('Ollama não retornou um stream.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let passText = '';
    let doneReason = '';

    const processLine = (line) => {
      if (!line.trim()) return;
      const data = JSON.parse(line);
      const chunk = data?.message?.content;
      if (chunk) {
        passText += chunk;
        fullText += chunk;
        onChunk?.(chunk);
      }
      if (data?.done) doneReason = data.done_reason || '';
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

    // Ollama puede cerrar el stream sin salto de línea tras el último objeto JSON.
    if (buffer.trim()) {
      try {
        processLine(buffer);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }

    const trimmed = passText.trimEnd();
    const boldMarkers = (trimmed.match(/\*\*/g) || []).length;
    const openCodeFence = ((trimmed.match(/```/g) || []).length % 2) === 1;
    const looksCutOff = boldMarkers % 2 === 1 || openCodeFence;
    const shouldContinue = continuationCount === 0 && (doneReason === 'length' || looksCutOff);

    if (!shouldContinue || !passText.trim()) break;

    requestMessages = [
      ...requestMessages,
      { role: 'assistant', content: passText },
      { role: 'user', content: 'Continue a resposta anterior exatamente de onde ela parou. Não repita o que já foi escrito, conclua os tópicos pendentes e termine as frases e a formatação.' },
    ];
    continuationCount += 1;
  }

  return { message: fullText, action: pendingAction };
}

async function streamProductionAI({
  message,
  analysis,
  transactions,
  history,
  onChunk,
}) {
  const response =
    await fetch(
      '/api/ai',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            message,
            analysis,
            transactions,
            history,
          }),
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      errorText ||
      `Erro ao consultar a IA. Status: ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error(
      'A API não retornou um stream.'
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = '';
  let fullText = '';
  let action = null;

  const processLine = (line) => {
    if (!line.trim()) return;
    const data = JSON.parse(line);
    if (data.type === 'text' && data.content) {
      fullText += data.content;
      onChunk?.(data.content);
    }
    if (data.type === 'action') action = data.action;
    if (data.type === 'error') throw new Error(data.message || 'Erro durante a resposta da IA.');
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
      } catch (parseError) {
        if (!(parseError instanceof SyntaxError)) throw parseError;
      }
    }
  }

  // Não descarte o último registro se o stream terminar sem newline.
  if (buffer.trim()) {
    try {
      processLine(buffer);
    } catch (parseError) {
      if (!(parseError instanceof SyntaxError)) throw parseError;
    }
  }

  return { message: fullText, action };
}

export default FinancialChat;
