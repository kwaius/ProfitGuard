export function getTopExpenses(transactions, limit = 5) {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .sort((a, b) => Number(b.value || 0) -
      Number(a.value || 0))
    .slice(0, limit)
    .map((transaction) => ({
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      value: Number(transaction.value || 0),
    }));
}

export function getCategoryExpenses(transactions, category) {
  const normalizedCategory = String(category || '')
    .trim()
    .toLowerCase();
  return transactions
    .filter((transaction) => transaction.type === 'expense' &&
      String(transaction.category || '')
        .trim()
        .toLowerCase()
        .includes(normalizedCategory))
    .map((transaction) => ({
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      value: Number(transaction.value || 0),
    }));
}

export function calculateSavings(value, percentage) {
  const numericValue = Number(value) || 0;
  const numericPercentage = Number(percentage) || 0;
  const savings = numericValue *
    (numericPercentage / 100);
  return {
    originalValue: numericValue,
    percentage: numericPercentage,
    savings,
    newValue: numericValue - savings,
  };
}

export function comparePeriods(transactions, period = 'month') {
  const validTransactions = transactions
    .map((transaction) => ({
      ...transaction,
      parsedDate: parseDate(transaction.date),
    }))
    .filter((transaction) => transaction.parsedDate);
  if (validTransactions.length === 0) {
    return {
      error: 'Não existem transações com datas válidas para realizar a comparação.',
    };
  }
  const latestDate = getLatestTransactionDate(validTransactions);
  const ranges = getComparisonRanges(latestDate, period);
  if (ranges.error) {
    return ranges;
  }
  const currentTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    ranges.currentStart &&
    transaction.parsedDate <=
    ranges.currentEnd);
  const previousTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    ranges.previousStart &&
    transaction.parsedDate <=
    ranges.previousEnd);
  const current = summarizePeriod(currentTransactions);
  const previous = summarizePeriod(previousTransactions);
  return {
    period,
    referenceDate: formatDate(latestDate),
    current: {
      start: formatDate(ranges.currentStart),
      end: formatDate(ranges.currentEnd),
      ...current,
    },
    previous: {
      start: formatDate(ranges.previousStart),
      end: formatDate(ranges.previousEnd),
      ...previous,
    },
    variation: {
      revenue: calculateVariation(previous.revenue, current.revenue),
      expenses: calculateVariation(previous.expenses, current.expenses),
      profit: calculateVariation(previous.profit, current.profit),
      margin: current.margin -
        previous.margin,
    },
  };
}

export function detectFinancialTrends(transactions) {
  const validTransactions = transactions
    .map((transaction) => ({
      ...transaction,
      parsedDate: parseDate(transaction.date),
    }))
    .filter((transaction) => transaction.parsedDate);
  if (validTransactions.length === 0) {
    return {
      error: 'Não existem transações com datas válidas suficientes para detectar tendências.',
    };
  }
  const latestDate = getLatestTransactionDate(validTransactions);
  const currentStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const currentEnd = new Date(latestDate);
  const previousStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
  const previousEnd = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0, 23, 59, 59, 999);
  const currentTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    currentStart &&
    transaction.parsedDate <=
    currentEnd);
  const previousTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    previousStart &&
    transaction.parsedDate <=
    previousEnd);
  const currentSummary = summarizePeriod(currentTransactions);
  const previousSummary = summarizePeriod(previousTransactions);
  const categoryTrends = compareExpenseCategories(currentTransactions, previousTransactions);
  const alerts = [];
  if (currentSummary.revenue > 0 &&
    previousSummary.revenue > 0 &&
    currentSummary.expenses >
    previousSummary.expenses) {
    const revenueVariation = calculateVariation(previousSummary.revenue, currentSummary.revenue);
    const expenseVariation = calculateVariation(previousSummary.expenses, currentSummary.expenses);
    if (revenueVariation !== null &&
      expenseVariation !== null &&
      expenseVariation >
      revenueVariation) {
      alerts.push({
        type: 'warning',
        code: 'expenses-growing-faster',
        message: `As despesas cresceram ${formatPercentage(
            expenseVariation
          )}, enquanto a receita cresceu ${formatPercentage(
            revenueVariation
          )}.`,
        revenueVariation,
        expenseVariation,
      });
    }
  }
  if (previousSummary.profit > 0 &&
    currentSummary.profit <
    previousSummary.profit) {
    const profitVariation = calculateVariation(previousSummary.profit, currentSummary.profit);
    if (profitVariation !== null) {
      alerts.push({
        type: 'danger',
        code: 'profit-decreasing',
        message: `O lucro caiu ${formatPercentage(
            Math.abs(
              profitVariation
            )
          )} em relação ao período anterior.`,
        variation: profitVariation,
      });
    }
  }
  const marginDifference = currentSummary.margin -
    previousSummary.margin;
  if (marginDifference <= -2) {
    alerts.push({
      type: 'warning',
      code: 'margin-decreasing',
      message: `A margem caiu ${Math.abs(
          marginDifference
        ).toFixed(1)} pontos percentuais.`,
      difference: marginDifference,
    });
  }
  categoryTrends
    .filter((category) => category.variation !== null &&
      category.variation >= 20)
    .slice(0, 5)
    .forEach((category) => {
      alerts.push({
        type: 'warning',
        code: 'category-growth',
        message: `A categoria ${category.category} cresceu ${formatPercentage(
            category.variation
          )}.`,
        category: category.category,
        current: category.current,
        previous: category.previous,
        variation: category.variation,
      });
    });
  return {
    referenceDate: formatDate(latestDate),
    currentPeriod: {
      start: formatDate(currentStart),
      end: formatDate(currentEnd),
      ...currentSummary,
    },
    previousPeriod: {
      start: formatDate(previousStart),
      end: formatDate(previousEnd),
      ...previousSummary,
    },
    categoryTrends,
    alerts,
    overallStatus: getOverallStatus(alerts),
  };
}

export function analyzeCategoryTrend(transactions, category, period = 'month') {
  const normalizedCategory = String(category || '')
    .trim()
    .toLowerCase();
  if (!normalizedCategory) {
    return {
      error: 'A categoria não foi informada.',
    };
  }
  const validTransactions = transactions
    .map((transaction) => ({
      ...transaction,
      parsedDate: parseDate(transaction.date),
    }))
    .filter((transaction) => transaction.parsedDate);
  if (validTransactions.length === 0) {
    return {
      error: 'Não existem transações com datas válidas.',
    };
  }
  const latestDate = getLatestTransactionDate(validTransactions);
  const ranges = getComparisonRanges(latestDate, period);
  if (ranges.error) {
    return ranges;
  }
  const currentTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    ranges.currentStart &&
    transaction.parsedDate <=
    ranges.currentEnd);
  const previousTransactions = validTransactions.filter((transaction) => transaction.parsedDate >=
    ranges.previousStart &&
    transaction.parsedDate <=
    ranges.previousEnd);
  const currentCategoryTransactions = currentTransactions.filter((transaction) => transaction.type === 'expense' &&
    String(transaction.category || '')
      .trim()
      .toLowerCase() ===
    normalizedCategory);
  const previousCategoryTransactions = previousTransactions.filter((transaction) => transaction.type === 'expense' &&
    String(transaction.category || '')
      .trim()
      .toLowerCase() ===
    normalizedCategory);
  const currentTotal = sumTransactionValues(currentCategoryTransactions);
  const previousTotal = sumTransactionValues(previousCategoryTransactions);
  const difference = currentTotal -
    previousTotal;
  const variation = calculateVariation(previousTotal, currentTotal);
  const topCurrentTransactions = [...currentCategoryTransactions]
    .sort((a, b) => Number(b.value || 0) -
      Number(a.value || 0))
    .slice(0, 5)
    .map((transaction) => ({
      description: transaction.description,
      date: transaction.date,
      value: Number(transaction.value || 0),
    }));
  const topPreviousTransactions = [...previousCategoryTransactions]
    .sort((a, b) => Number(b.value || 0) -
      Number(a.value || 0))
    .slice(0, 5)
    .map((transaction) => ({
      description: transaction.description,
      date: transaction.date,
      value: Number(transaction.value || 0),
    }));
  return {
    category,
    period,
    currentPeriod: {
      start: formatDate(ranges.currentStart),
      end: formatDate(ranges.currentEnd),
      total: currentTotal,
      transactionCount: currentCategoryTransactions.length,
    },
    previousPeriod: {
      start: formatDate(ranges.previousStart),
      end: formatDate(ranges.previousEnd),
      total: previousTotal,
      transactionCount: previousCategoryTransactions.length,
    },
    difference,
    variation,
    topCurrentTransactions,
    topPreviousTransactions,
    interpretation: buildCategoryInterpretation(difference, variation, currentCategoryTransactions, previousCategoryTransactions),
  };
}

function summarizePeriod(transactions) {
  const revenue = transactions
    .filter((transaction) => transaction.type ===
      'income')
    .reduce((total, transaction) => total +
      Number(transaction.value || 0), 0);
  const expenses = transactions
    .filter((transaction) => transaction.type ===
      'expense')
    .reduce((total, transaction) => total +
      Number(transaction.value || 0), 0);
  const profit = revenue - expenses;
  const margin = revenue > 0
    ? (profit / revenue) * 100
    : 0;
  return {
    revenue,
    expenses,
    profit,
    margin,
  };
}

function compareExpenseCategories(currentTransactions, previousTransactions) {
  const currentCategories = sumCategories(currentTransactions);
  const previousCategories = sumCategories(previousTransactions);
  const categories = new Set([
    ...Object.keys(currentCategories),
    ...Object.keys(previousCategories),
  ]);
  return Array.from(categories)
    .map((category) => {
      const current = currentCategories[category] || 0;
      const previous = previousCategories[category] || 0;
      return {
        category,
        current,
        previous,
        variation: calculateVariation(previous, current),
      };
    })
    .sort((a, b) => {
      const aValue = a.variation ??
        -Infinity;
      const bValue = b.variation ??
        -Infinity;
      return (bValue - aValue);
    });
}

function sumCategories(transactions) {
  return transactions
    .filter((transaction) => transaction.type ===
      'expense')
    .reduce((result, transaction) => {
      const category = transaction.category ||
        'Sem categoria';
      result[category] =
        (result[category] || 0) +
        Number(transaction.value || 0);
      return result;
    }, {});
}

function sumTransactionValues(transactions) {
  return transactions.reduce((total, transaction) => total +
    Number(transaction.value || 0), 0);
}

function getComparisonRanges(latestDate, period) {
  let currentStart;
  let currentEnd;
  let previousStart;
  let previousEnd;
  if (period === 'month') {
    currentStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    currentEnd =
      new Date(latestDate);
    previousStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
    previousEnd = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0, 23, 59, 59, 999);
  }
  else if (period === '30days') {
    currentEnd =
      new Date(latestDate);
    currentStart =
      new Date(latestDate);
    currentStart.setDate(currentStart.getDate() - 29);
    previousEnd =
      new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousStart =
      new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 29);
  }
  else if (period === '7days') {
    currentEnd =
      new Date(latestDate);
    currentStart =
      new Date(latestDate);
    currentStart.setDate(currentStart.getDate() - 6);
    previousEnd =
      new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousStart =
      new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
  }
  else {
    return {
      error: 'Período de comparação inválido.',
    };
  }
  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function calculateVariation(previous, current) {
  if (previous === 0) {
    return current === 0
      ? 0
      : null;
  }
  return (((current - previous) /
    Math.abs(previous)) *
    100);
}

function getOverallStatus(alerts) {
  if (alerts.some((alert) => alert.type === 'danger')) {
    return 'danger';
  }
  if (alerts.some((alert) => alert.type === 'warning')) {
    return 'warning';
  }
  return 'healthy';
}

function buildCategoryInterpretation(difference, variation, currentTransactions, previousTransactions) {
  if (difference === 0) {
    return 'A categoria permaneceu estável entre os períodos.';
  }
  if (previousTransactions.length === 0 &&
    currentTransactions.length > 0) {
    return 'A categoria não teve despesas no período anterior e passou a apresentar despesas no período atual.';
  }
  if (currentTransactions.length === 0) {
    return 'A categoria não apresentou despesas no período atual.';
  }
  if (variation !== null &&
    variation > 0) {
    return `A categoria aumentou ${Math.abs(
      variation
    ).toFixed(
      1
    )}% em relação ao período anterior.`;
  }
  return `A categoria diminuiu ${Math.abs(
    variation || 0
  ).toFixed(
    1
  )}% em relação ao período anterior.`;
}

function getLatestTransactionDate(transactions) {
  return new Date(Math.max(...transactions.map((transaction) => transaction.parsedDate.getTime())));
}

function formatPercentage(value) {
  return `${Math.abs(
    value
  ).toFixed(1)}%`;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day,] = value
      .split('-')
      .map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year,] = value
      .split('/')
      .map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR');
}
