const MARKET_NEWS_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

const COMTRADE_BASE = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';

const PRODUCT_CODES = [
  { match: /caf[eé]|coffee/i, code: '0901', label: 'Café' },
  { match: /cacau|chocolate|cocoa/i, code: '1806', label: 'Cacau e chocolate' },
  { match: /soja|soybean/i, code: '1201', label: 'Soja' },
  { match: /mel\b|honey/i, code: '0409', label: 'Mel natural' },
  { match: /carne bovina|beef|bovino/i, code: '0201', label: 'Carne bovina fresca ou refrigerada' },
  { match: /camiseta|camisetas|t-shirt|tee shirt/i, code: '6109', label: 'Camisetas de malha' },
  { match: /cal[cç]ado|sapato|t[eê]nis|footwear/i, code: '64', label: 'Calçados' },
  { match: /cosm[eé]tico|maquiagem|skincare/i, code: '3304', label: 'Preparações de beleza e cuidados da pele' },
  { match: /roupa|vestu[aá]rio|confec[cç][aã]o|clothing|apparel|camisa|camisaria/i, code: '61', label: 'Vestuário de malha' },
  { match: /fruta|manga|mang[aã]|uva|banana|fruit/i, code: '08', label: 'Frutas e nozes comestíveis' },
  { match: /a[cç][uú]car|sugar/i, code: '1701', label: 'Açúcares' },
  { match: /m[aá]quina|maquin[aá]rio|machinery/i, code: '84', label: 'Máquinas e equipamentos mecânicos' },
  { match: /eletr[oô]nico|eletr[oô]nica|electronic/i, code: '85', label: 'Máquinas e equipamentos elétricos' },
];

function findProductCode(product) {
  if (typeof product !== 'string' || !product.trim())
    return null;
  return PRODUCT_CODES.find((item) => item.match.test(product)) || null;
}

async function fetchJson(url, timeout = 10000) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ProfitGuard/1.0 (market research)' },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok)
    throw new Error(`Fonte externa respondeu HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    const body = await response.text();
    throw new Error(body.slice(0, 180) || 'Resposta externa não era JSON');
  }
  return response.json();
}

function normalizeGdeltDate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string')
    return '';
  const match = rawDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (match)
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
  return rawDate;
}

function normalizeArticle(article) {
  return {
    title: String(article.title || '').trim(),
    url: article.url || '',
    source: article.domain || article.sourceCountry || 'GDELT',
    date: normalizeGdeltDate(article.seendate || article.date || ''),
    image: article.socialimage || '',
    language: article.language || '',
  };
}

function isPortugueseArticle(article) {
  const language = String(article.language || '').trim().toLowerCase();
  if (language)
    return language === 'portuguese' || language === 'português' || language === 'pt';
  // The query itself restricts results to Portuguese-language coverage.
  return true;
}

async function getGlobalNews() {
  const params = new URLSearchParams({
    query: '(economy OR exports OR tariffs OR "supply chain" OR inflation OR "international trade" OR crisis) sourcelang:portuguese',
    mode: 'ArtList',
    maxrecords: '30',
    timespan: '14d',
    format: 'json',
    sort: 'DateDesc',
  });
  const result = await fetchJson(`${MARKET_NEWS_URL}?${params}`);
  return (Array.isArray(result.articles) ? result.articles : [])
    .map(normalizeArticle)
    .filter((article) => article.title && article.url && isPortugueseArticle(article))
    .slice(0, 12);
}

async function getExportResearch(product) {
  const matched = findProductCode(product);
  if (!matched) {
    return {
      product,
      matched: false,
      message: 'Ainda não há mapeamento automático para esse produto. Tente uma categoria mais específica, como café, cacau, soja, calçados, cosméticos ou vestuário.',
      source: 'UN Comtrade — https://comtradeapi.un.org/',
      records: [],
    };
  }
  const years = [2024, 2023];
  let lastError = null;
  for (const year of years) {
    try {
      const params = new URLSearchParams({
        reporterCode: '76',
        period: String(year),
        cmdCode: matched.code,
        flowCode: 'X',
        maxRecords: '500',
        includeDesc: 'true',
      });
      const result = await fetchJson(`${COMTRADE_BASE}?${params}`, 4000);
      const rows = Array.isArray(result.data) ? result.data : [];
      const records = rows
        .filter((row) => row.partnerDesc && !/world|mundo|areas? nes/i.test(row.partnerDesc))
        .map((row) => ({
          country: row.partnerDesc,
          exportValueUsd: Number(row.primaryValue) || 0,
          netWeightKg: Number(row.netWgt) || 0,
          partnerCode: row.partnerCode,
        }))
        .filter((row) => row.exportValueUsd > 0)
        .sort((a, b) => b.exportValueUsd - a.exportValueUsd)
        .slice(0, 8);
      if (records.length) {
        return {
          product,
          productLabel: matched.label,
          hsCode: matched.code,
          matched: true,
          year,
          records,
          source: 'UN Comtrade',
          sourceUrl: `https://comtradeapi.un.org/`,
          methodology: 'Principais destinos identificados nos registros de exportação do Brasil para o código comercial associado ao produto. O dado é histórico de comércio, não uma garantia de demanda futura.',
        };
      }
    }
    catch (error) {
      lastError = error;
    }
  }
  return {
    product,
    productLabel: matched.label,
    hsCode: matched.code,
    matched: true,
    year: null,
    records: [],
    source: 'UN Comtrade',
    sourceUrl: 'https://comtradeapi.un.org/',
    message: lastError
      ? 'Não foi possível consultar a base de comércio agora. Tente novamente mais tarde.'
      : 'A consulta não encontrou registros de exportação para esse código nos anos testados.',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
  const product = typeof req.query?.product === 'string' ? req.query.product.slice(0, 120) : '';
  const [newsResult, exportResult] = await Promise.allSettled([
    getGlobalNews(),
    product ? getExportResearch(product) : Promise.resolve(null),
  ]);
  return res.status(200).json({
    updatedAt: new Date().toISOString(),
    events: newsResult.status === 'fulfilled' ? newsResult.value : [],
    eventsError: newsResult.status === 'rejected' ? 'Não foi possível atualizar as notícias globais agora.' : null,
    exportResearch: exportResult.status === 'fulfilled' ? exportResult.value : null,
    exportError: exportResult.status === 'rejected' ? 'Não foi possível consultar os dados de comércio internacional agora.' : null,
  });
}
