const DAY_MS = 24 * 60 * 60 * 1000;

export function parseBrazilianDate(value) {
  if (!value)
    return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export function formatIsoDate(value) {
  const date = parseBrazilianDate(value);
  if (!date)
    return 'Data não informada';
  return date.toLocaleDateString('pt-BR');
}

export function getCashFlowSnapshot(settings = {}, scheduledItems = [], now = new Date()) {
  const rawBalance = settings.startingBalance;
  const hasStartingBalance = rawBalance !== '' &&
    rawBalance !== null &&
    rawBalance !== undefined &&
    Number.isFinite(Number(rawBalance));
  const startingBalance = hasStartingBalance
    ? Number(rawBalance)
    : null;
  const reserveAmount = Math.max(0, Number(settings.reserveAmount) || 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pendingItems = (Array.isArray(scheduledItems) ? scheduledItems : [])
    .filter((item) => item.status !== 'done')
    .map((item) => ({
      ...item,
      amount: Math.max(0, Number(item.amount) || 0),
      parsedDate: parseBrazilianDate(item.dueDate),
    }))
    .filter((item) => item.parsedDate);
  const summarizeHorizon = (days) => {
    const endDate = new Date(today.getTime() + days * DAY_MS);
    const items = pendingItems.filter((item) => item.parsedDate <= endDate);
    const inflows = items
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const outflows = items
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const projectedBalance = hasStartingBalance
      ? startingBalance + inflows - outflows
      : null;
    return {
      days,
      endDate,
      inflows,
      outflows,
      netPlanned: inflows - outflows,
      projectedBalance,
      itemCount: items.length,
    };
  };
  const horizons = [30, 60, 90].map(summarizeHorizon);
  const overdueItems = pendingItems.filter((item) => item.parsedDate < today);
  const next30 = horizons[0];
  let status = 'unknown';
  let statusLabel = 'Informe o saldo atual';
  let statusDescription = 'Cadastre o saldo disponível hoje para calcular o caixa projetado.';
  if (hasStartingBalance) {
    if (horizons.some((item) => item.projectedBalance < 0)) {
      status = 'danger';
      statusLabel = 'Risco de caixa negativo';
      statusDescription = 'As movimentações cadastradas podem deixar o caixa abaixo de zero em um dos períodos projetados.';
    }
    else if (horizons.some((item) => item.projectedBalance < reserveAmount)) {
      status = 'warning';
      statusLabel = 'Atenção à reserva';
      statusDescription = 'Uma das projeções fica abaixo da reserva mínima definida.';
    }
    else if (pendingItems.length === 0) {
      status = 'limited';
      statusLabel = 'Projeção incompleta';
      statusDescription = 'O saldo foi informado, mas ainda não há entradas ou saídas futuras cadastradas.';
    }
    else {
      status = 'healthy';
      statusLabel = 'Sem risco previsto nos lançamentos';
      statusDescription = 'As movimentações cadastradas mantêm o caixa acima da reserva nos períodos analisados. Itens não cadastrados não entram na projeção.';
    }
  }
  return {
    hasStartingBalance,
    startingBalance,
    reserveAmount,
    pendingCount: pendingItems.length,
    overdueCount: overdueItems.length,
    overdueTotal: overdueItems.reduce((sum, item) => sum + item.amount, 0),
    next30Inflows: next30.inflows,
    next30Outflows: next30.outflows,
    next30Net: next30.netPlanned,
    horizons,
    status,
    statusLabel,
    statusDescription,
    upcomingItems: [...pendingItems].sort((a, b) => a.parsedDate - b.parsedDate),
  };
}

export function buildCashFlowAIPrompt(snapshot) {
  return [
    'Analise meu fluxo de caixa usando os dados estruturados a seguir. Não invente movimentações futuras nem trate uma projeção como certeza.',
    'Explique o que está cadastrado, destaque riscos e sugira ações práticas. Avise quando os dados forem insuficientes.',
    JSON.stringify(snapshot, null, 2),
  ].join('\n\n');
}
