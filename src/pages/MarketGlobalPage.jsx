import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarketGlobalPage.css';

function formatUSD(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function normalizeGdeltDate(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

function formatDate(value) {
  if (!value) return 'Data não informada';
  const date = new Date(normalizeGdeltDate(value));
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleString('pt-BR', { dateStyle: 'medium' });
}

function isPortugueseArticle(article) {
  const language = String(article.language || '').trim().toLowerCase();
  if (language) return language === 'portuguese' || language === 'português' || language === 'pt';
  // The query itself restricts results to Portuguese-language coverage.
  return true;
}

function identifySignal(title = '') {
  const text = title.toLowerCase();
  if (/oil|petr[oó]leo|energy|energia|fuel|combust[ií]vel/.test(text)) {
    return { label: 'Energia e transporte', description: 'Pode pressionar custos de produção e logística, dependendo da cadeia de fornecedores da empresa.' };
  }
  if (/tariff|tarifa|trade war|sanction|san[cç][aã]o|duty/.test(text)) {
    return { label: 'Comércio e tarifas', description: 'Pode alterar custos de importação, acesso a mercados ou competitividade de determinados produtos.' };
  }
  if (/inflation|infla[cç][aã]o|interest rate|juros|central bank|banco central/.test(text)) {
    return { label: 'Inflação e juros', description: 'Pode afetar poder de compra, custo do crédito e preços de fornecedores; o efeito depende do país e do setor.' };
  }
  if (/shipping|freight|port|logistic|supply chain|transport|porto|log[ií]stica/.test(text)) {
    return { label: 'Logística e fornecimento', description: 'Pode indicar risco de atraso ou variação nos custos de frete. Confirme a rota usada pela empresa antes de agir.' };
  }
  if (/export|import|trade|market|com[eé]rcio|exporta[cç][aã]o/.test(text)) {
    return { label: 'Comércio internacional', description: 'Pode sinalizar mudança em mercados ou fluxos comerciais; não confirma sozinho uma oportunidade para sua empresa.' };
  }
  return { label: 'Sinal econômico global', description: 'O assunto pode ter impacto setorial. É necessário cruzar a notícia com fornecedores, clientes, produtos e países atendidos.' };
}

function MarketGlobalPage({ transactions = [] }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loadingNews, setLoadingNews] = useState(true);
  const [product, setProduct] = useState('');
  const [research, setResearch] = useState(null);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [researchError, setResearchError] = useState('');

  const companySummary = useMemo(() => {
    const revenue = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const categories = [...new Set(transactions.map((item) => item.category).filter(Boolean))];
    return { transacoesAnalisadas: transactions.length, receitaRegistrada: revenue, despesasRegistradas: expenses, lucroCalculadoNoHistorico: revenue - expenses, categoriasRegistradas: categories };
  }, [transactions]);

  const loadNews = useCallback(async (selectedProduct = '') => {
    setLoadingNews(true);
    setEventsError('');
    try {
      const params = new URLSearchParams();
      if (selectedProduct) params.set('product', selectedProduct);
      const response = await fetch(`/api/market${params.toString() ? `?${params}` : ''}`);
      if (!response.ok) throw new Error('Endpoint de mercado indisponível neste ambiente.');
      const result = await response.json();
      const apiEvents = Array.isArray(result.events) ? result.events : [];
      setLastUpdated(result.updatedAt || '');
      if (selectedProduct) {
        setResearch(result.exportResearch || null);
        setResearchError(result.exportError || '');
      }
      // A API pode responder HTTP 200 mesmo quando a fonte de notícias falha.
      // Nesse caso, tenta buscar as notícias diretamente como segunda opção.
      if (result.eventsError && apiEvents.length === 0) {
        throw new Error(result.eventsError);
      }
      setEvents(apiEvents);
      if (result.eventsError) setEventsError(result.eventsError);
      return true;
    } catch (error) {
      // Fallback para notícias públicas quando a API serverless não está executando no modo vite dev.
      try {
        const params = new URLSearchParams({
          query: '(economy OR exports OR tariffs OR "supply chain" OR inflation OR "international trade" OR crisis) sourcelang:portuguese',
          mode: 'ArtList',
          maxrecords: '30',
          timespan: '14d',
          format: 'json',
          sort: 'DateDesc',
        });
        const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
        if (!response.ok) throw new Error('Fonte de notícias indisponível.', { cause: error });
        const result = await response.json();
        const fallbackEvents = (result.articles || []).map((article) => ({
          title: article.title,
          url: article.url,
          source: article.domain || 'GDELT',
          date: normalizeGdeltDate(article.seendate || article.date || ''),
          language: article.language || '',
        })).filter((article) => article.title && article.url && isPortugueseArticle(article)).slice(0, 12);
        if (!fallbackEvents.length) {
          setEvents([]);
          setEventsError('A fonte não retornou notícias em português para esses temas neste momento. Tente atualizar mais tarde.');
          return false;
        }
        setEvents(fallbackEvents);
        setLastUpdated(new Date().toISOString());
        setEventsError('As notícias foram carregadas diretamente da fonte pública. A pesquisa de exportação continua vinculada à API do projeto.');
        return true;
      } catch {
        setEvents([]);
        setEventsError('Não foi possível carregar notícias agora. Verifique sua conexão ou tente atualizar novamente.');
        if (selectedProduct) setResearchError('Não foi possível consultar dados de exportação agora.');
        return false;
      }
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadNews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNews]);

  const handleExportResearch = async (event) => {
    event.preventDefault();
    if (!product.trim()) {
      setResearchError('Digite um produto para pesquisar mercados potenciais.');
      return;
    }

    setLoadingResearch(true);
    setResearchError('');
    setResearch(null);
    try {
      const params = new URLSearchParams({ product: product.trim() });
      const response = await fetch(`/api/market?${params}`);
      if (!response.ok) throw new Error('A API de pesquisa não está disponível neste ambiente.');
      const result = await response.json();
      setResearch(result.exportResearch || null);
      if (result.exportError) setResearchError(result.exportError);
      if (!events.length && Array.isArray(result.events)) setEvents(result.events);
      if (result.eventsError) setEventsError(result.eventsError);
      setLastUpdated(result.updatedAt || new Date().toISOString());
    } catch {
      setResearchError('Não consegui acessar a API local do Mercado Global. Reinicie o Vite depois de extrair a versão corrigida e tente novamente. Se estiver usando o site publicado, confira a função /api/market no deploy da Vercel.');
    } finally {
      setLoadingResearch(false);
    }
  };

  const askAIAboutEvent = (article) => {
    const signal = identifySignal(article.title);
    const prompt = [
      'Analise este acontecimento internacional e explique possíveis impactos para minha empresa, usando os dados financeiros disponíveis no ProfitGuard.',
      'Separe fatos fornecidos pela notícia de hipóteses. Não afirme impacto direto sem evidência e indique quais dados internos precisam ser verificados.',
      `Título: ${article.title}`,
      `Fonte: ${article.source || 'Fonte não identificada'}`,
      `Data: ${formatDate(article.date)}`,
      `Link: ${article.url}`,
      `Categoria inicial do sinal: ${signal.label}`,
      `Interpretação preliminar: ${signal.description}`,
      `Resumo financeiro do histórico carregado: ${JSON.stringify(companySummary)}`,
    ].join('\n');
    localStorage.setItem('profitguard-ai-pending-prompt', JSON.stringify({
      prompt,
      displayContent: `Analise o possível impacto desta notícia: ${article.title}`,
    }));
    navigate('/dashboard');
  };

  const askAIAboutExport = () => {
    if (!research) return;
    const prompt = [
      'Avalie esta pesquisa preliminar de exportação para a minha empresa. Não trate o histórico de exportação como garantia de demanda futura nem como recomendação definitiva de investimento.',
      'Explique o que os dados demonstram, quais mercados merecem pesquisa adicional e quais informações faltam (margem, logística, tarifas, requisitos técnicos, câmbio e capacidade de entrega).',
      `Pesquisa: ${JSON.stringify(research, null, 2)}`,
      `Resumo financeiro do histórico carregado: ${JSON.stringify(companySummary)}`,
    ].join('\n\n');
    localStorage.setItem('profitguard-ai-pending-prompt', JSON.stringify({
      prompt,
      displayContent: `Analise oportunidades de exportação para ${research.productLabel || research.product}.`,
    }));
    navigate('/dashboard');
  };

  return (
    <section className="module-page market-page">
      <div className="module-page-header">
        <div>
          <span className="module-eyebrow">CONTEXTO EXTERNO</span>
          <h2>Mercado Global</h2>
          <p>Acompanhe acontecimentos internacionais e investigue destinos que já aparecem nos dados de exportação do Brasil.</p>
        </div>
        <button className="module-secondary-button" type="button" disabled={loadingNews} onClick={() => loadNews(product)}>{loadingNews ? 'Atualizando…' : '↻ Atualizar dados'}</button>
      </div>
      <div className="market-disclaimer">
        <span>ⓘ</span>
        <p>Notícias e estatísticas ajudam a identificar sinais, mas não provam que uma crise afeta diretamente sua empresa. As oportunidades abaixo usam comércio histórico e precisam ser avaliadas com custos, regras de exportação e capacidade de entrega.</p>
      </div>
      <div className="market-section-header">
        <div>
          <h3>🌍 Radar de acontecimentos</h3>
          <p>Notícias internacionais recentes relacionadas a economia, comércio, tarifas e cadeias de fornecimento.</p>
        </div>
        {lastUpdated && <span>Atualizado em {formatDate(lastUpdated)}</span>}
      </div>
      {eventsError && <div className="market-inline-notice">{eventsError}</div>}
      {loadingNews ? (
        <div className="market-empty-card"><div className="market-spinner" /><strong>Buscando acontecimentos globais…</strong><p>Consultando a fonte de notícias.</p></div>
      ) : events.length === 0 ? (
        <div className="market-empty-card"><div>🌐</div><strong>Nenhuma notícia carregada</strong><p>Use atualizar dados novamente. O ProfitGuard não mostrará notícias fictícias como se fossem atuais.</p></div>
      ) : (
        <div className="market-news-grid">
          {events.slice(0, 12).map((article, index) => {
            const signal = identifySignal(article.title);
            return (
              <article className="market-news-card" key={`${article.url}-${index}`}>
                <div className="market-news-meta"><span>{signal.label}</span><time>{formatDate(article.date)}</time></div>
                <h4>{article.title}</h4>
                <p>{signal.description}</p>
                <div className="market-news-footer">
                  <span>{article.source || 'Fonte externa'}</span>
                  <div>
                    <a href={article.url} target="_blank" rel="noreferrer">Ler notícia ↗</a>
                    <button type="button" onClick={() => askAIAboutEvent(article)}>Analisar impacto com IA</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="market-source-line">Fonte de notícias: <a href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer">GDELT Project</a>. A lista depende da disponibilidade e dos resultados da fonte.</p>
      <div className="market-export-panel">
        <div className="market-export-heading">
          <span className="market-export-icon">📦</span>
          <div>
            <h3>Radar de Exportação</h3>
            <p>Pesquise um produto e veja os principais destinos que aparecem no histórico de exportação brasileiro.</p>
          </div>
        </div>
        <div className="market-quick-products" aria-label="Categorias de produto disponíveis para pesquisa">
          <span>Pesquisar uma categoria:</span>
          {['Café', 'Soja', 'Cacau/chocolate', 'Cosméticos', 'Calçados', 'Camiseta', 'Vestuário', 'Mel', 'Frutas'].map((suggestedProduct) => (
            <button key={suggestedProduct} type="button" onClick={() => setProduct(suggestedProduct)}>{suggestedProduct}</button>
          ))}
        </div>
        <form className="market-search-form" onSubmit={handleExportResearch}>
          <label htmlFor="market-product">Produto ou categoria</label>
          <div className="market-search-row">
            <input id="market-product" value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Ex.: café, soja, cosméticos, calçados…" maxLength={120} />
            <button className="module-primary-button" disabled={loadingResearch}>{loadingResearch ? 'Consultando…' : 'Pesquisar mercados'}</button>
          </div>
          <small>Categorias com consulta automática nesta versão: café, cacau/chocolate, soja, mel, carne bovina, calçados, camisetas, cosméticos, vestuário, frutas, açúcar, máquinas e eletrônicos.</small>
        </form>
        {researchError && <div className="market-inline-notice">{researchError}</div>}
        {research && (
          <div className="market-research-result">
            <div className="market-research-title-row">
              <div>
                <span className="market-result-label">PESQUISA DE COMÉRCIO</span>
                <h4>{research.productLabel || research.product}</h4>
                {research.year && <p>Exportações brasileiras registradas em {research.year} · código HS {research.hsCode}</p>}
              </div>
              {research.matched && <span className="market-data-badge">Dados externos</span>}
            </div>
            {research.records?.length ? (
              <>
                <div className="market-trade-list">
                  {research.records.map((record) => (
                    <div className="market-trade-row" key={`${record.country}-${record.partnerCode}`}>
                      <span>{record.country}</span>
                      <div className="market-trade-track"><div style={{ width: `${Math.max(2, record.exportValueUsd / research.records[0].exportValueUsd * 100)}%` }} /></div>
                      <strong>{formatUSD(record.exportValueUsd)}</strong>
                    </div>
                  ))}
                </div>
                <p className="market-methodology">{research.methodology}</p>
                <button className="module-primary-button" type="button" onClick={askAIAboutExport}>🤖 Avaliar oportunidades com a IA</button>
              </>
            ) : (
              <div className="market-research-no-results"><p>{research.message || 'Não há dados disponíveis para esta pesquisa.'}</p></div>
            )}
            <p className="market-source-line">Fonte: <a href={research.sourceUrl || 'https://comtradeapi.un.org/'} target="_blank" rel="noreferrer">UN Comtrade</a> · estatísticas oficiais de comércio internacional.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MarketGlobalPage;
