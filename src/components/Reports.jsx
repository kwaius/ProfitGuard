import { useMemo } from 'react';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function Reports({ transactions = [] }) {
  const report = useMemo(() => {
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

    const margin =
      revenue > 0
        ? (profit / revenue) * 100
        : 0;

    const categories = {};

    transactions
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .forEach((transaction) => {
        if (!categories[transaction.category]) {
          categories[transaction.category] = 0;
        }

        categories[transaction.category] +=
          transaction.value;
      });

    return {
      revenue,
      expenses,
      profit,
      margin,
      categories,
    };
  }, [transactions]);

  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const totalCategoryExpenses =
    Object.values(report.categories).reduce(
      (total, value) => total + value,
      0
    );
  const categoryChartData = {
    labels: Object.keys(report.categories),

    datasets: [
      {
        data: Object.values(report.categories),

        backgroundColor: [
          '#2563eb',
          '#16a34a',
          '#dc2626',
          '#d97706',
          '#7c3aed',
          '#0891b2',
        ],

        borderWidth: 0,

        hoverOffset: 6,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    cutout: '65%',

    plugins: {
      legend: {
        position: 'bottom',

        labels: {
          usePointStyle: true,
          padding: 18,
        },
      },

      tooltip: {
        callbacks: {
          label: function(context) {
            return (
              `${context.label}: ` +
              context.parsed.toLocaleString(
                'pt-BR',
                {
                  style: 'currency',
                  currency: 'BRL',
                }
              )
            );
          },
        },
      },
    },
  };
  const comparisonChartData = {
    labels: ['Financeiro'],

    datasets: [
      {
        label: 'Receita',

        data: [report.revenue],

        backgroundColor: '#2563eb',

        borderRadius: 8,
      },

      {
        label: 'Despesas',

        data: [report.expenses],

        backgroundColor: '#dc2626',

        borderRadius: 8,
      },
    ],
  };

  const comparisonChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom',

        labels: {
          usePointStyle: true,
          padding: 18,
        },
      },

      tooltip: {
        callbacks: {
          label: function(context) {
            return (
              `${context.dataset.label}: ` +
              context.parsed.y.toLocaleString(
                'pt-BR',
                {
                  style: 'currency',
                  currency: 'BRL',
                }
              )
            );
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          callback: function(value) {
            return value.toLocaleString(
              'pt-BR',
              {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }
            );
          },
        },
      },
    },
  };

  return (
    <section className="reports">
      <div className="reports-header">
        <div>
          <h2>Relatórios</h2>
          <p>
            Análise detalhada do desempenho financeiro
          </p>
        </div>
      </div>
      <div className="report-summary">
        <div className="report-card revenue-report">
          <span>Receita total</span>
          <strong>
            {formatCurrency(report.revenue)}
          </strong>
          <small>
            Total de entradas
          </small>
        </div>
        <div className="report-card expense-report">
          <span>Despesas totais</span>
          <strong>
            {formatCurrency(report.expenses)}
          </strong>
          <small>
            Total de saídas
          </small>
        </div>
        <div className="report-card profit-report">
          <span>Lucro</span>
          <strong>
            {formatCurrency(report.profit)}
          </strong>
          <small>
            Receita - despesas
          </small>
        </div>
        <div className="report-card margin-report">
          <span>Margem de lucro</span>
          <strong>
            {report.margin.toFixed(1)}%
          </strong>
          <small>
            Margem atual
          </small>
        </div>
      </div>
      <div className="report-charts">
        <div className="report-chart-card">
          <div className="report-section-header">
            <h3>Despesas por categoria</h3>
            <p>
              Distribuição dos seus gastos
            </p>
          </div>
          <div className="report-doughnut">
            {Object.keys(report.categories).length >
              0 ? (
              <Doughnut
                data={categoryChartData}
                options={categoryChartOptions}
              />
            ) : (
              <div className="report-empty">
                Nenhuma despesa encontrada.
              </div>
            )}
          </div>
        </div>
        <div className="report-chart-card">
          <div className="report-section-header">
            <h3>Receitas x Despesas</h3>
            <p>
              Comparação financeira
            </p>
          </div>
          <div className="report-bar">
            <Bar
              data={comparisonChartData}
              options={comparisonChartOptions}
            />
          </div>
        </div>
      </div>
      <div className="report-section">
        <div className="report-section-header">
          <div>
            <h3>Detalhamento das despesas</h3>
            <p>
              Veja onde seu dinheiro está sendo gasto
            </p>
          </div>
        </div>
        {Object.keys(report.categories).length ===
          0 ? (
          <div className="report-empty">
            Nenhuma despesa encontrada.
          </div>
        ) : (
          <div className="category-list">
            {Object.entries(
              report.categories
            ).map(([category, value]) => {
              const percentage =
                totalCategoryExpenses > 0
                  ? (value /
                    totalCategoryExpenses) *
                  100
                  : 0;
              return (
                <div
                  className="category-item"
                  key={category}
                >
                  <div className="category-info">
                    <strong>
                      {category}
                    </strong>
                    <span>
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-bar-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                  <span className="category-percentage">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="report-section">
        <div className="report-section-header">
          <div>
            <h3>Resumo financeiro</h3>
            <p>
              Comparação entre entradas e saídas
            </p>
          </div>
        </div>
        <div className="financial-comparison">
          <div className="comparison-row">
            <div>
              <span className="comparison-label">
                Entradas
              </span>
              <strong className="comparison-income">
                {formatCurrency(report.revenue)}
              </strong>
            </div>
            <div className="comparison-bar">
              <div
                className="comparison-bar-income"
                style={{
                  width:
                    report.revenue > 0
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          </div>
          <div className="comparison-row">
            <div>
              <span className="comparison-label">
                Saídas
              </span>
              <strong className="comparison-expense">
                {formatCurrency(report.expenses)}
              </strong>
            </div>
            <div className="comparison-bar">
              <div
                className="comparison-bar-expense"
                style={{
                  width:
                    report.revenue > 0
                      ? `${Math.min(
                          (report.expenses /
                            report.revenue) *
                            100,
                          100
                        )}%`
                      : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reports;
