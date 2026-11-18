function FinancialCards({
  transactions,
  comparison,
  period,
}) {
  const revenue = transactions
    .filter(
      (transaction) =>
        transaction.type === 'income'
    )
    .reduce(
      (total, transaction) =>
        total + transaction.value,
      0
    );

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense'
    )
    .reduce(
      (total, transaction) =>
        total + transaction.value,
      0
    );

  const profit = revenue - expenses;

  const profitMargin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatComparison = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return `${Math.abs(value).toFixed(1)}%`;
  };

  const renderComparison = (
    value,
    positiveIsGood = true
  ) => {
    if (
      period === 'all' ||
      value === null ||
      value === undefined
    ) {
      return (
        <div className="card-comparison neutral">
          <span className="comparison-dot"></span>
          <span>Sem comparação</span>
        </div>
      );
    }

    const isPositive = value >= 0;

    const isGood = positiveIsGood
      ? isPositive
      : !isPositive;

    return (
      <div
        className={`card-comparison ${
          isGood
            ? 'positive'
            : 'negative'
        }`}
      >
        <span className="comparison-arrow">
          {isPositive ? '↑' : '↓'}
        </span>
        <strong>
          {formatComparison(value)}
        </strong>
        <span>
          vs. período anterior
        </span>
      </div>
    );
  };

  return (
    <section className="financial-cards">
      <div className="card revenue-card">
        <div className="card-top">
          <div>
            <span className="card-label">
              Receita
            </span>
            <h2>
              {formatCurrency(revenue)}
            </h2>
          </div>
          <div className="card-icon revenue-icon">
            $
          </div>
        </div>
        {renderComparison(
          comparison?.revenue,
          true
        )}
      </div>
      <div className="card profit-card">
        <div className="card-top">
          <div>
            <span className="card-label">
              Lucro
            </span>
            <h2>
              {formatCurrency(profit)}
            </h2>
          </div>
          <div className="card-icon profit-icon">
            ↗
          </div>
        </div>
        {renderComparison(
          comparison?.profit,
          true
        )}
      </div>
      <div className="card expense-card">
        <div className="card-top">
          <div>
            <span className="card-label">
              Despesas
            </span>
            <h2>
              {formatCurrency(expenses)}
            </h2>
          </div>
          <div className="card-icon expense-icon">
            ↓
          </div>
        </div>
        {renderComparison(
          comparison?.expenses,
          false
        )}
      </div>
      <div className="card margin-card">
        <div className="card-top">
          <div>
            <span className="card-label">
              Margem de lucro
            </span>
            <h2>
              {profitMargin.toFixed(1)}%
            </h2>
          </div>
          <div className="card-icon margin-icon">
            %
          </div>
        </div>
        {renderComparison(
          comparison?.margin,
          true
        )}
      </div>
    </section>
  );
}

export default FinancialCards;
