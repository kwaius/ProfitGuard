import { useState } from 'react';

function FinancialInsights({ analysis }) {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAnalysis = () => {
    if (!analysis) {
      return;
    }

    setLoading(true);
    setAiAnalysis('');

    // Simula o processamento da IA
    setTimeout(() => {
      const generatedAnalysis =
        generateLocalAnalysis(analysis);

      setAiAnalysis(generatedAnalysis);
      setLoading(false);
    }, 1200);
  };

  return (
    <section className="financial-insights">
      <div className="insights-header">
        <div>
          <h2>🤖 Análise inteligente</h2>
          <p>
            Use a inteligência do ProfitGuard para
            analisar seu desempenho financeiro.
          </p>
        </div>
        <button
          className="ai-analyze-button"
          onClick={generateAnalysis}
          disabled={loading}
        >
          {loading
            ? 'Analisando...'
            : 'Analisar minhas finanças'}
        </button>
      </div>
      {!aiAnalysis && !loading && (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">
            🤖
          </div>
          <div>
            <h3>
              Pronto para analisar
            </h3>
            <p>
              Clique no botão para que o ProfitGuard
              analise suas receitas, despesas,
              lucro, margem e principais riscos.
            </p>
          </div>
        </div>
      )}
      {loading && (
        <div className="ai-loading-state">
          <div className="ai-loading-icon">
            🤖
          </div>
          <div>
            <h3>
              Analisando seus dados...
            </h3>
            <p>
              O ProfitGuard está avaliando seu
              desempenho financeiro.
            </p>
          </div>
          <div className="ai-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      {aiAnalysis && !loading && (
        <div className="ai-result">
          <div className="ai-result-header">
            <div className="ai-result-icon">
              ✨
            </div>
            <div>
              <h3>
                Análise do ProfitGuard
              </h3>
              <span>
                Análise baseada nos dados atuais
              </span>
            </div>
          </div>
          <div className="ai-result-content">
            {aiAnalysis}
          </div>
          <button
            className="ai-reanalyze-button"
            onClick={generateAnalysis}
          >
            ↻ Nova análise
          </button>
        </div>
      )}
    </section>
  );
}

function generateLocalAnalysis(analysis) {
  const {
    revenue,
    expenses,
    profit,
    margin,
    biggestExpenseCategory,
    largestIncome,
    largestExpense,
    expenseConcentration,
    revenueConcentration,
    financialStatus,
  } = analysis;

  const lines = [];
  if (financialStatus === 'healthy') {
    lines.push(
      `O desempenho financeiro atual é saudável. A receita de ${formatCurrency(
        revenue
      )} supera as despesas de ${formatCurrency(
        expenses
      )}, gerando um lucro de ${formatCurrency(
        profit
      )}.`
    );
  } else if (financialStatus === 'positive') {
    lines.push(
      `O resultado financeiro é positivo. A empresa apresenta receita de ${formatCurrency(
        revenue
      )}, despesas de ${formatCurrency(
        expenses
      )} e lucro de ${formatCurrency(
        profit
      )}.`
    );
  } else if (financialStatus === 'negative') {
    lines.push(
      `O período apresenta um resultado negativo. As despesas de ${formatCurrency(
        expenses
      )} superaram a receita de ${formatCurrency(
        revenue
      )}, gerando um prejuízo de ${formatCurrency(
        Math.abs(profit)
      )}.`
    );
  }
  if (margin >= 30) {
    lines.push(
      `A margem de lucro está em ${margin.toFixed(
        1
      )}%, indicando uma boa relação entre receitas e custos.`
    );
  } else if (margin >= 10) {
    lines.push(
      `A margem de lucro está em ${margin.toFixed(
        1
      )}%. O resultado é positivo, mas existe espaço para aumentar a eficiência dos custos.`
    );
  } else {
    lines.push(
      `A margem de lucro está em apenas ${margin.toFixed(
        1
      )}%. Pequenas reduções nas despesas podem ter impacto relevante no resultado.`
    );
  }
  if (biggestExpenseCategory) {
    if (expenseConcentration >= 50) {
      lines.push(
        `O principal ponto de atenção é a categoria ${
          biggestExpenseCategory.name
        }, responsável por ${expenseConcentration.toFixed(
          1
        )}% das despesas. Vale revisar essa categoria e procurar oportunidades de redução.`
      );
    } else {
      lines.push(
        `A maior categoria de despesas é ${
          biggestExpenseCategory.name
        }, representando ${expenseConcentration.toFixed(
          1
        )}% dos gastos totais.`
      );
    }
  }
  if (largestIncome) {
    lines.push(
      `A maior entrada registrada foi "${largestIncome.description}", no valor de ${formatCurrency(
        largestIncome.value
      )}.`
    );
  }
  if (largestExpense) {
    lines.push(
      `A maior saída registrada foi "${largestExpense.description}", no valor de ${formatCurrency(
        largestExpense.value
      )}.`
    );
  }
  if (revenueConcentration >= 50) {
    lines.push(
      `Existe concentração relevante de receita: uma única transação representa ${revenueConcentration.toFixed(
        1
      )}% das entradas. Diversificar as receitas pode reduzir riscos.`
    );
  }

  return lines.join('\n\n');
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default FinancialInsights;
