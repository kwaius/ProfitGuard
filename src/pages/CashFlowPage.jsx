import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildCashFlowAIPrompt,
  formatCurrency,
  formatIsoDate,
  getCashFlowSnapshot,
} from '../ai/cashFlowTools';
import './CashFlowPage.css';

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function CashFlowPage({
  transactions = [],
  settings = { startingBalance: '', reserveAmount: '0' },
  scheduledItems = [],
  onSettingsChange = () => { },
  onAddScheduledItem = () => { },
  onDeleteScheduledItem = () => { },
  onRealizeScheduledItem = () => { },
}) {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [dueDate, setDueDate] = useState(todayISO());
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const snapshot = useMemo(
    () => getCashFlowSnapshot(settings, scheduledItems),
    [settings, scheduledItems]
  );

  const historySummary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const expense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    return { income, expense, count: transactions.length };
  }, [transactions]);

  const handleCreate = (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !dueDate) {
      setFormError('Preencha a descrição, um valor maior que zero e a data de vencimento.');
      return;
    }

    onAddScheduledItem({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description: description.trim(),
      amount: parsedAmount,
      type,
      dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    setDescription('');
    setAmount('');
    setType('expense');
    setDueDate(todayISO());
    setFormError('');
    setShowForm(false);
  };

  const handleAskAI = () => {
    const prompt = buildCashFlowAIPrompt({
      ...snapshot,
      upcomingItems: snapshot.upcomingItems.map((item) => ({
        description: item.description,
        amount: item.amount,
        type: item.type,
        dueDate: item.dueDate,
      })),
    });
    localStorage.setItem('profitguard-ai-pending-prompt', prompt);
    navigate('/dashboard');
  };

  const maxAbsoluteBalance = Math.max(
    1,
    ...snapshot.horizons.map((item) => Math.abs(item.projectedBalance || 0))
  );

  return (
    <section className="module-page cashflow-page">
      <div className="module-page-header">
        <div>
          <span className="module-eyebrow">PLANEJAMENTO FINANCEIRO</span>
          <h2>Fluxo de Caixa</h2>
          <p>Saiba quanto você tem, o que precisa pagar e como os compromissos podem afetar seu saldo.</p>
        </div>
        <button className="module-primary-button" type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Fechar formulário' : '+ Nova previsão'}
        </button>
      </div>
      <div className={`cashflow-status-card status-${snapshot.status}`}>
        <div className="cashflow-status-icon">{snapshot.status === 'danger' ? '⚠️' : snapshot.status === 'warning' ? '🟡' : snapshot.status === 'healthy' ? '✓' : '◎'}</div>
        <div className="cashflow-status-copy">
          <strong>{snapshot.statusLabel}</strong>
          <p>{snapshot.statusDescription}</p>
        </div>
        <button className="module-secondary-button" type="button" onClick={handleAskAI}>🤖 Analisar com IA</button>
      </div>
      <div className="cashflow-settings-grid">
        <label className="cashflow-setting-card">
          <span>Saldo disponível hoje (R$)</span>
          <div className="cashflow-money-input">
            <span>R$</span>
            <input
              type="number"
              step="0.01"
              value={settings.startingBalance ?? ''}
              onChange={(event) => onSettingsChange({ ...settings, startingBalance: event.target.value })}
              placeholder="Ex.: 18450,00"
            />
          </div>
          <small>Informe o saldo real da conta/caixa. Ele não é deduzido automaticamente do histórico importado.</small>
        </label>
        <label className="cashflow-setting-card">
          <span>Reserva mínima desejada (R$)</span>
          <div className="cashflow-money-input">
            <span>R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.reserveAmount ?? '0'}
              onChange={(event) => onSettingsChange({ ...settings, reserveAmount: event.target.value })}
              placeholder="Ex.: 5000"
            />
          </div>
          <small>O sistema alerta quando um dos saldos projetados fica abaixo dessa reserva.</small>
        </label>
      </div>
      <div className="cashflow-kpi-grid">
        <article className="cashflow-kpi-card">
          <span>Saldo atual informado</span>
          <strong>{snapshot.hasStartingBalance ? formatCurrency(snapshot.startingBalance) : '—'}</strong>
          <small>Valor definido por você</small>
        </article>
        <article className="cashflow-kpi-card">
          <span>Entradas previstas · 30 dias</span>
          <strong className="cashflow-positive">{formatCurrency(snapshot.next30Inflows)}</strong>
          <small>Com base nos lançamentos futuros</small>
        </article>
        <article className="cashflow-kpi-card">
          <span>Saídas previstas · 30 dias</span>
          <strong className="cashflow-negative">{formatCurrency(snapshot.next30Outflows)}</strong>
          <small>Inclui compromissos vencidos não baixados</small>
        </article>
        <article className="cashflow-kpi-card">
          <span>Saldo projetado · 30 dias</span>
          <strong className={snapshot.horizons[0].projectedBalance < 0 ? 'cashflow-negative' : ''}>
            {snapshot.hasStartingBalance ? formatCurrency(snapshot.horizons[0].projectedBalance) : '—'}
          </strong>
          <small>Saldo atual + entradas − saídas cadastradas</small>
        </article>
      </div>
      {showForm && (
        <form className="cashflow-form-card" onSubmit={handleCreate}>
          <div className="cashflow-section-heading">
            <div>
              <h3>Cadastrar movimentação futura</h3>
              <p>Inclua contas, salários, parcelas, recebimentos e pagamentos esperados.</p>
            </div>
          </div>
          <div className="cashflow-form-grid">
            <label>
              Descrição
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Aluguel, venda prevista, fornecedor" />
            </label>
            <label>
              Tipo
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="income">Entrada prevista</option>
                <option value="expense">Saída prevista</option>
              </select>
            </label>
            <label>
              Valor (R$)
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
            </label>
            <label>
              Vencimento/recebimento
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          {formError && <p className="cashflow-form-error">{formError}</p>}
          <div className="cashflow-form-actions">
            <button type="button" className="module-secondary-button" onClick={() => { setShowForm(false); setFormError(''); }}>Cancelar</button>
            <button type="submit" className="module-primary-button">Salvar previsão</button>
          </div>
        </form>
      )}
      <div className="cashflow-panel">
        <div className="cashflow-section-heading">
          <div>
            <h3>Projeção de saldo</h3>
            <p>Considera apenas o saldo informado e os compromissos cadastrados até cada prazo.</p>
          </div>
          <span className="cashflow-data-count">{snapshot.pendingCount} lançamento(s) pendente(s)</span>
        </div>
        <div className="cashflow-projection-list">
          {snapshot.horizons.map((item) => {
            const negative = item.projectedBalance < 0;
            const width = Math.max(2, Math.min(100, Math.abs(item.projectedBalance || 0) / maxAbsoluteBalance * 100));
            return (
              <div className="cashflow-projection-row" key={item.days}>
                <div className="cashflow-projection-label">
                  <strong>{item.days} dias</strong>
                  <span>{item.itemCount} compromisso(s)</span>
                </div>
                <div className="cashflow-bar-track">
                  <div className={`cashflow-bar ${negative ? 'is-negative' : ''}`} style={{ width: `${width}%` }} />
                </div>
                <strong className={negative ? 'cashflow-negative' : ''}>
                  {snapshot.hasStartingBalance ? formatCurrency(item.projectedBalance) : 'Informe o saldo'}
                </strong>
              </div>
            );
          })}
        </div>
        {snapshot.pendingCount === 0 && (
          <div className="cashflow-empty-note">
            <span>🧾</span>
            <div>
              <strong>A projeção ainda está incompleta</strong>
              <p>Cadastre recebimentos e despesas futuras para o sistema estimar como o saldo pode evoluir. Sem esses dados, o gráfico não presume entradas recorrentes.</p>
            </div>
          </div>
        )}
      </div>
      <div className="cashflow-panel">
        <div className="cashflow-section-heading">
          <div>
            <h3>Próximas movimentações</h3>
            <p>Itens vencidos continuam no cálculo até serem realizados ou excluídos.</p>
          </div>
          <button type="button" className="module-secondary-button" onClick={() => setShowForm(true)}>+ Adicionar</button>
        </div>
        {snapshot.upcomingItems.length === 0 ? (
          <div className="cashflow-empty-state">
            <div>📅</div>
            <strong>Nenhum compromisso cadastrado</strong>
            <p>Adicione suas próximas contas e entradas para construir a projeção.</p>
            <button className="module-primary-button" type="button" onClick={() => setShowForm(true)}>Cadastrar primeira previsão</button>
          </div>
        ) : (
          <div className="cashflow-table-wrap">
            <table className="cashflow-table">
              <thead>
                <tr><th>Descrição</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {snapshot.upcomingItems.map((item) => {
                  const overdue = item.parsedDate < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.description}</strong>{overdue && <small className="cashflow-overdue-badge">Vencido</small>}</td>
                      <td>{formatIsoDate(item.dueDate)}</td>
                      <td><span className={`cashflow-type-pill ${item.type}`}>{item.type === 'income' ? 'Entrada' : 'Saída'}</span></td>
                      <td className={item.type === 'income' ? 'cashflow-positive' : 'cashflow-negative'}>{item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}</td>
                      <td>
                        <div className="cashflow-row-actions">
                          <button type="button" title="Marcar como realizado" onClick={() => onRealizeScheduledItem(item.id)}>Baixar</button>
                          <button type="button" title="Excluir previsão" className="delete" onClick={() => onDeleteScheduledItem(item.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="cashflow-history-note">
        <div className="cashflow-history-icon">📚</div>
        <div>
          <strong>Histórico atualmente carregado</strong>
          <p>{historySummary.count} transações · Entradas registradas: {formatCurrency(historySummary.income)} · Saídas registradas: {formatCurrency(historySummary.expense)}.</p>
          <small>Esses totais representam as transações existentes no sistema, não confirmam o saldo bancário atual. Informe o saldo disponível e cadastre movimentações futuras para melhorar a projeção.</small>
        </div>
      </div>
    </section>
  );
}

export default CashFlowPage;
