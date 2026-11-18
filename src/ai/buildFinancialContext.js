export function buildFinancialContext(analysis) {
  if (!analysis) {
    return null;
  }
  return {
    transacoes: {
      total: analysis.transactionCount,
      entradas: analysis.incomeTransactionCount,
      saidas: analysis.expenseTransactionCount,
    },
    financeiro: {
      receita: analysis.revenue,
      despesas: analysis.expenses,
      lucro: analysis.profit,
      margem: analysis.margin,
    },
    medias: {
      entrada: analysis.averageIncome,
      saida: analysis.averageExpense,
    },
    maiorEntrada: analysis.largestIncome
      ? {
        descricao: analysis.largestIncome.description,
        valor: analysis.largestIncome.value,
        categoria: analysis.largestIncome.category,
        data: analysis.largestIncome.date,
      }
      : null,
    maiorSaida: analysis.largestExpense
      ? {
        descricao: analysis.largestExpense.description,
        valor: analysis.largestExpense.value,
        categoria: analysis.largestExpense.category,
        data: analysis.largestExpense.date,
      }
      : null,
    principalCategoriaDeDespesa: analysis.biggestExpenseCategory
      ? {
        nome: analysis.biggestExpenseCategory.name,
        valor: analysis.biggestExpenseCategory.value,
        percentual: analysis.biggestExpenseCategory.percentage,
      }
      : null,
    concentracao: {
      receita: analysis.revenueConcentration,
      despesas: analysis.expenseConcentration,
    },
    situacaoFinanceira: analysis.financialStatus,
    alertas: analysis.alerts,
  };
}
