import Transactions from '../components/Transactions';

function TransactionsPage({
  transactions = [],
  onDelete,
  onEdit,
  onNewTransaction,
}) {
  const revenue = transactions
    .filter(
      (transaction) => transaction.type === 'income'
    )
    .reduce(
      (total, transaction) =>
        total + transaction.value,
      0
    );

  const expenses = transactions
    .filter(
      (transaction) => transaction.type === 'expense'
    )
    .reduce(
      (total, transaction) =>
        total + transaction.value,
      0
    );

  const balance = revenue - expenses;

  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <section className="transactions-page">
      <div className="transactions-page-header">
        <div>
          <h2>Transações</h2>
          <p>
            Gerencie todas as movimentações financeiras
          </p>
        </div>
        <button
          className="new-transaction-button"
          onClick={onNewTransaction}
        >
          + Nova transação
        </button>
      </div>
      <div className="transaction-summary">
        <div className="transaction-summary-card income-summary">
          <span>Total de entradas</span>
          <strong>
            {formatCurrency(revenue)}
          </strong>
          <small>
            Somatório das receitas
          </small>
        </div>
        <div className="transaction-summary-card expense-summary">
          <span>Total de saídas</span>
          <strong>
            {formatCurrency(expenses)}
          </strong>
          <small>
            Somatório das despesas
          </small>
        </div>
        <div
          className={`transaction-summary-card ${
            balance >= 0
              ? 'balance-summary'
              : 'negative-balance-summary'
          }`}
        >
          <span>Saldo</span>
          <strong>
            {formatCurrency(balance)}
          </strong>
          <small>
            Entradas - saídas
          </small>
        </div>
        <div className="transaction-summary-card count-summary">
          <span>Transações</span>
          <strong>
            {transactions.length}
          </strong>
          <small>
            Movimentações no período
          </small>
        </div>
      </div>
      <div className="transactions-page-table">
        <div className="transactions-page-table-header">
          <div>
            <h3>Lista de transações</h3>
            <p>
              Consulte, pesquise e gerencie suas movimentações
            </p>
          </div>
        </div>
        <Transactions
          transactions={transactions}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </section>
  );
}

export default TransactionsPage;
