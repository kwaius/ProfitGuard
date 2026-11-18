import { useMemo, useState } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function FinancialChart({ transactions = [] }) {
  const [chartPeriod, setChartPeriod] = useState('6');

  const chartData = useMemo(() => {
    const today = new Date();

    let startDate;
    let labels = [];
    let revenueData = [];
    let expensesData = [];

    if (chartPeriod === '7') {
      startDate = new Date(today);

      startDate.setDate(
        today.getDate() - 6
      );

      for (let i = 0;i < 7;i++) {
        const date = new Date(startDate);

        date.setDate(
          startDate.getDate() + i
        );

        labels.push(
          date.toLocaleDateString(
            'pt-BR',
            {
              day: '2-digit',
              month: '2-digit',
            }
          )
        );

        let revenue = 0;
        let expenses = 0;

        transactions.forEach((transaction) => {
          const [
            day,
            month,
            year,
          ] = transaction.date.split('/');

          const transactionDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );

          if (
            transactionDate.toDateString() ===
            date.toDateString()
          ) {
            if (
              transaction.type === 'income'
            ) {
              revenue += transaction.value;
            } else {
              expenses += transaction.value;
            }
          }
        });

        revenueData.push(revenue);
        expensesData.push(expenses);
      }
    }

    else if (chartPeriod === '30') {
      startDate = new Date(today);

      startDate.setDate(
        today.getDate() - 29
      );

      for (let i = 0;i < 30;i++) {
        const date = new Date(startDate);

        date.setDate(
          startDate.getDate() + i
        );

        labels.push(
          date.toLocaleDateString(
            'pt-BR',
            {
              day: '2-digit',
              month: '2-digit',
            }
          )
        );

        let revenue = 0;
        let expenses = 0;

        transactions.forEach((transaction) => {
          const [
            day,
            month,
            year,
          ] = transaction.date.split('/');

          const transactionDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );

          if (
            transactionDate.toDateString() ===
            date.toDateString()
          ) {
            if (
              transaction.type === 'income'
            ) {
              revenue += transaction.value;
            } else {
              expenses += transaction.value;
            }
          }
        });

        revenueData.push(revenue);
        expensesData.push(expenses);
      }
    }

    else {
      const months = Number(chartPeriod);

      const monthNames = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];

      for (let i = months - 1;i >= 0;i--) {
        const date = new Date(
          today.getFullYear(),
          today.getMonth() - i,
          1
        );

        const month =
          date.getMonth();

        const year =
          date.getFullYear();

        labels.push(monthNames[month]);

        let revenue = 0;
        let expenses = 0;

        transactions.forEach((transaction) => {
          const [
            ,
            transactionMonth,
            transactionYear,
          ] = transaction.date.split('/');

          const transactionMonthNumber =
            Number(transactionMonth) - 1;

          const transactionYearNumber =
            Number(transactionYear);

          if (
            transactionMonthNumber === month &&
            transactionYearNumber === year
          ) {
            if (
              transaction.type === 'income'
            ) {
              revenue += transaction.value;
            } else {
              expenses += transaction.value;
            }
          }
        });

        revenueData.push(revenue);
        expensesData.push(expenses);
      }
    }

    return {
      labels,

      datasets: [
        {
          label: 'Receita',

          data: revenueData,

          borderColor: '#2563eb',

          backgroundColor:
            'rgba(37, 99, 235, 0.12)',

          borderWidth: 3,

          tension: 0.4,

          pointBackgroundColor:
            '#2563eb',

          pointBorderColor: '#ffffff',

          pointBorderWidth: 2,

          pointRadius: 4,

          pointHoverRadius: 6,

          fill: true,
        },

        {
          label: 'Despesas',

          data: expensesData,

          borderColor: '#dc2626',

          backgroundColor:
            'rgba(220, 38, 38, 0.08)',

          borderWidth: 3,

          tension: 0.4,

          pointBackgroundColor:
            '#dc2626',

          pointBorderColor: '#ffffff',

          pointBorderWidth: 2,

          pointRadius: 4,

          pointHoverRadius: 6,

          fill: true,
        },
      ],
    };
  }, [transactions, chartPeriod]);

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },

      tooltip: {
        backgroundColor: '#111827',

        padding: 12,

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

        grid: {
          color: '#e5e7eb',
        },
      },

      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <section className="chart-card">
      <div className="chart-header">
        <div>
          <h2>Desempenho financeiro</h2>
          <p>
            Receitas e despesas no período
          </p>
        </div>
        <select
          value={chartPeriod}
          onChange={(event) =>
            setChartPeriod(event.target.value)
          }
        >
          <option value="7">
            Últimos 7 dias
          </option>
          <option value="30">
            Últimos 30 dias
          </option>
          <option value="3">
            Últimos 3 meses
          </option>
          <option value="6">
            Últimos 6 meses
          </option>
          <option value="12">
            Este ano
          </option>
        </select>
      </div>
      <div className="chart-container">
        <Line
          data={chartData}
          options={options}
        />
      </div>
    </section>
  );
}

export default FinancialChart;
