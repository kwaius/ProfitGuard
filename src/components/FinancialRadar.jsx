import { useMemo } from 'react';
import {
  detectFinancialTrends,
} from '../ai/aiTools';

function FinancialRadar({
  transactions = [],
}) {
  const radar = useMemo(() => {
    return detectFinancialTrends(
      transactions
    );
  }, [transactions]);

  if (
    !radar ||
    radar.error
  ) {
    return null;
  }

  const alerts =
    radar.alerts || [];

  const hasAlerts =
    alerts.length > 0;

  const status =
    radar.overallStatus ||
    'healthy';

  const statusConfig = {
    healthy: {
      icon: '🟢',
      title: 'Tudo sob controle',
      description:
        'Não encontrei mudanças relevantes que exijam atenção imediata.',
    },

    warning: {
      icon: '🟡',
      title: 'Vale ficar de olho',
      description:
        'Encontrei alguns pontos que merecem acompanhamento.',
    },

    danger: {
      icon: '🔴',
      title: 'Atenção necessária',
      description:
        'Encontrei mudanças importantes que merecem uma análise mais cuidadosa.',
    },
  };

  const currentStatus =
    statusConfig[status] ||
    statusConfig.healthy;

  const handleInvestigate = (
    alert
  ) => {
    let prompt =
      'Analise este alerta financeiro com base nos dados disponíveis.';

    if (
      alert.code ===
      'category-growth'
    ) {
      prompt =
        `Analise por que a categoria ${alert.category} ` +
        `teve uma variação de ${Math.abs(
          alert.variation || 0
        ).toFixed(
          1
        )}% e quais transações contribuíram para isso.`;
    }

    else if (
      alert.code ===
      'expenses-growing-faster'
    ) {
      prompt =
        'Analise por que minhas despesas estão crescendo mais rápido que minha receita e quais categorias contribuíram para esse aumento.';
    }

    else if (
      alert.code ===
      'profit-decreasing'
    ) {
      prompt =
        'Analise por que meu lucro caiu e quais fatores financeiros contribuíram para essa queda.';
    }

    else if (
      alert.code ===
      'margin-decreasing'
    ) {
      prompt =
        'Analise por que minha margem caiu e quais mudanças nas receitas e despesas contribuíram para isso.';
    }

    window.dispatchEvent(
      new CustomEvent(
        'profitguard-ai-investigate',
        {
          detail: {
            prompt,
            alert,
          },
        }
      )
    );
  };

  return (
    <section
      className={`financial-radar radar-${status}`}
    >
      <div className="radar-header">
        <div className="radar-title">
          <div className="radar-icon">
            📡
          </div>
          <div>
            <h2>
              Radar Financeiro
            </h2>
            <p>
              Visão rápida do que está acontecendo
              com suas finanças
            </p>
          </div>
        </div>
        <div className="radar-status">
          <span>
            {currentStatus.icon}
          </span>
          <strong>
            {currentStatus.title}
          </strong>
        </div>
      </div>
      <div className="radar-summary">
        <div className="radar-summary-icon">
          {currentStatus.icon}
        </div>
        <div>
          <h3>
            {currentStatus.title}
          </h3>
          <p>
            {currentStatus.description}
          </p>
        </div>
      </div>
      {hasAlerts ? (
        <div className="radar-alerts">
          {alerts
            .slice(0, 3)
            .map(
              (
                alert,
                index
              ) => (
                <RadarAlert
                  key={`${alert.code}-${index}`}
                  alert={alert}
                  onInvestigate={
                    handleInvestigate
                  }
                />
              )
            )}
        </div>
      ) : (
        <div className="radar-empty">
          <span>✅</span>
          <p>
            Nenhum alerta financeiro relevante
            foi detectado neste momento.
          </p>
        </div>
      )}
    </section>
  );
}

function RadarAlert({
  alert,
  onInvestigate,
}) {
  const isDanger =
    alert.type === 'danger';

  return (
    <article
      className={`radar-alert ${
        isDanger
          ? 'radar-alert-danger'
          : 'radar-alert-warning'
      }`}
    >
      <div className="radar-alert-icon">
        {isDanger
          ? '🔴'
          : '🟡'}
      </div>
      <div className="radar-alert-content">
        <span className="radar-alert-label">
          {isDanger
            ? 'Atenção'
            : 'Ponto de atenção'}
        </span>
        <p>
          {alert.message}
        </p>
        {alert.category && (
          <span className="radar-alert-category">
            Categoria:{' '}
            {alert.category}
          </span>
        )}
        <button
          type="button"
          className="radar-investigate-button"
          onClick={() =>
            onInvestigate(alert)
          }
        >
          🤖 Investigar com IA
        </button>
      </div>
    </article>
  );
}

export default FinancialRadar;
