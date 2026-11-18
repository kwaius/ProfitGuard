export function analyzeFinancialData(transactions = []) {
  const incomeTransactions = transactions.filter((transaction) => transaction.type === 'income');
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense');
  const revenue = incomeTransactions.reduce((total, transaction) => total + transaction.value, 0);
  const expenses = expenseTransactions.reduce((total, transaction) => total + transaction.value, 0);
  const profit = revenue - expenses;
  const margin = revenue > 0
    ? (profit / revenue) * 100
    : 0;
  const averageIncome = incomeTransactions.length > 0
    ? revenue / incomeTransactions.length
    : 0;
  const averageExpense = expenseTransactions.length > 0
    ? expenses / expenseTransactions.length
    : 0;
  const largestIncome = incomeTransactions.length > 0
    ? [...incomeTransactions].sort((a, b) => b.value - a.value)[0]
    : null;
  const largestExpense = expenseTransactions.length > 0
    ? [...expenseTransactions].sort((a, b) => b.value - a.value)[0]
    : null;
  const expenseCategories = {};
  expenseTransactions.forEach((transaction) => {
    const category = transaction.category;
    expenseCategories[category] =
      (expenseCategories[category] || 0) +
      transaction.value;
  });
  const categoryRanking = Object.entries(expenseCategories)
    .map(([name, value]) => ({
      name,
      value,
      percentage: expenses > 0
        ? (value / expenses) * 100
        : 0,
    }))
    .sort((a, b) => b.value - a.value);
  const biggestExpenseCategory = categoryRanking[0] || null;
  const revenueConcentration = largestIncome && revenue > 0
    ? (largestIncome.value / revenue) * 100
    : 0;
  const expenseConcentration = biggestExpenseCategory
    ? biggestExpenseCategory.percentage
    : 0;
  let financialStatus = 'neutral';
  if (profit > 0 && margin >= 30) {
    financialStatus = 'healthy';
  }
  else if (profit > 0) {
    financialStatus = 'positive';
  }
  else if (profit < 0) {
    financialStatus = 'negative';
  }
  const alerts = [];
  if (profit < 0) {
    alerts.push({
      type: 'danger',
      code: 'negative-profit',
      message: 'As despesas estão maiores que as receitas.',
    });
  }
  if (margin >= 0 && margin < 10) {
    alerts.push({
      type: 'warning',
      code: 'low-margin',
      message: 'A margem de lucro está abaixo de 10%.',
    });
  }
  if (expenseConcentration >= 50) {
    alerts.push({
      type: 'warning',
      code: 'expense-concentration',
      message: `A categoria ${biggestExpenseCategory.name} concentra ${expenseConcentration.toFixed(
        1
      )}% das despesas.`,
    });
  }
  if (revenueConcentration >= 50) {
    alerts.push({
      type: 'warning',
      code: 'revenue-concentration',
      message: 'Uma única transação representa uma parcela muito grande da receita.',
    });
  }
  if (incomeTransactions.length === 0 &&
    expenseTransactions.length > 0) {
    alerts.push({
      type: 'danger',
      code: 'no-revenue',
      message: 'Não existem entradas registradas no período.',
    });
  }
  return {
    transactionCount: transactions.length,
    incomeTransactionCount: incomeTransactions.length,
    expenseTransactionCount: expenseTransactions.length,
    revenue,
    expenses,
    profit,
    margin,
    averageIncome,
    averageExpense,
    largestIncome,
    largestExpense,
    expenseCategories: categoryRanking,
    biggestExpenseCategory,
    revenueConcentration,
    expenseConcentration,
    financialStatus,
    alerts,
  };
}
