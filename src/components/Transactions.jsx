import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSearchParams } from 'react-router-dom';

function Transactions({
  transactions = [],
  onDelete,
  onEdit,
}) {
  const [searchParams] = useSearchParams();

  const [showAll, setShowAll] = useState(true);

  const [search, setSearch] = useState(
    searchParams.get('search') || ''
  );

  const [categoryFilter, setCategoryFilter] =
    useState(
      searchParams.get('category') || 'all'
    );

  const [typeFilter, setTypeFilter] = useState(
    searchParams.get('type') || 'all'
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchParams.get('search') || '');
      setCategoryFilter(searchParams.get('category') || 'all');
      setTypeFilter(searchParams.get('type') || 'all');
      setShowAll(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        transactions.map(
          (transaction) => transaction.category
        )
      ),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        transaction.category === categoryFilter;

      const matchesType =
        typeFilter === 'all' ||
        transaction.type === typeFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType
      );
    });
  }, [
    transactions,
    search,
    categoryFilter,
    typeFilter,
  ]);

  const displayedTransactions = showAll
    ? filteredTransactions
    : filteredTransactions.slice(0, 5);

  return (
    <section className="transactions">
      <div className="transactions-header">
        <div>
          <h2>Transações</h2>
          <p>
            Gerencie suas movimentações financeiras
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setShowAll((current) => !current)
          }
        >
          {showAll
            ? 'Mostrar menos'
            : 'Ver todas'}
        </button>
      </div>
      <div className="transaction-filters">
        <div className="search-box">
          <span>🔎</span>
          <input
            type="text"
            placeholder="Buscar transação..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          <option value="all">
            Todas as categorias
          </option>
          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="all">
            Todos os tipos
          </option>
          <option value="income">
            Entradas
          </option>
          <option value="expense">
            Saídas
          </option>
        </select>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {displayedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="empty-transactions"
                >
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              displayedTransactions.map(
                (transaction) => (
                  <tr
                    key={transaction.id}
                  >
                    <td>
                      {transaction.description}
                    </td>
                    <td>
                      {transaction.category}
                    </td>
                    <td>
                      {transaction.date}
                    </td>
                    <td
                      className={
                        transaction.type ===
                          'income'
                          ? 'income'
                          : 'expense'
                      }
                    >
                      {transaction.type ===
                        'income'
                        ? '+'
                        : '-'}{' '}
                      {transaction.value.toLocaleString(
                        'pt-BR',
                        {
                          style: 'currency',
                          currency: 'BRL',
                        }
                      )}
                    </td>
                    <td>
                      {transaction.type ===
                        'income'
                        ? 'Entrada'
                        : 'Saída'}
                    </td>
                    <td>
                      <div className="transaction-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            onEdit(transaction)
                          }
                          title="Editar transação"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            onDelete(
                              transaction.id
                            )
                          }
                          title="Excluir transação"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Transactions;
