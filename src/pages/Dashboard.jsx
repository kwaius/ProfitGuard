import FinancialCards from '../components/FinancialCards';
import FinancialChart from '../components/FinancialChart';
import Transactions from '../components/Transactions';
import PeriodFilter from '../components/PeriodFilter';
import FinancialInsights from '../components/FinancialInsights';
import FinancialChat from '../components/FinancialChat';
import FinancialRadar from '../components/FinancialRadar';

import { analyzeFinancialData } from '../ai/financialAnalyzer';
import { getCashFlowSnapshot } from '../ai/cashFlowTools';

function Dashboard({
  transactions,
  period,
  setPeriod,
  onDelete,
  onEdit,
  onNewTransaction,
  cashFlowSettings = { startingBalance: '', reserveAmount: '0' },
  scheduledCashFlows = [],
}) {
  const financialAnalysis =
    analyzeFinancialData(transactions);

  const cashFlowSnapshot = getCashFlowSnapshot(
    cashFlowSettings,
    scheduledCashFlows,
  );

  const aiAnalysis = {
    ...financialAnalysis,
    fluxoDeCaixa: {
      saldoAtualInformado: cashFlowSnapshot.startingBalance,
      reservaMinima: cashFlowSnapshot.reserveAmount,
      entradasPrevistas30Dias: cashFlowSnapshot.next30Inflows,
      saidasPrevistas30Dias: cashFlowSnapshot.next30Outflows,
      saldoProjetado30Dias: cashFlowSnapshot.horizons[0].projectedBalance,
      saldoProjetado60Dias: cashFlowSnapshot.horizons[1].projectedBalance,
      saldoProjetado90Dias: cashFlowSnapshot.horizons[2].projectedBalance,
      status: cashFlowSnapshot.statusLabel,
      compromissosPendentes: cashFlowSnapshot.upcomingItems.map((item) => ({
        descricao: item.description,
        tipo: item.type,
        valor: item.amount,
        vencimento: item.dueDate,
      })),
    },
  };

  return (
    <>
      <div className="dashboard-toolbar">
        <div>
          <h2>Resumo financeiro</h2>
          <p>
            Acompanhe o desempenho do seu negócio
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="new-transaction-button"
            onClick={onNewTransaction}
          >
            + Nova transação
          </button>
          <PeriodFilter
            period={period}
            setPeriod={setPeriod}
          />
        </div>
      </div>
      <FinancialCards
        transactions={transactions}
      />
      <FinancialRadar
        transactions={transactions}
      />
      <FinancialInsights
        analysis={financialAnalysis}
      />
      <FinancialChat
        analysis={aiAnalysis}
        transactions={transactions}
      />
      <FinancialChart
        transactions={transactions}
      />
      <Transactions
        transactions={transactions}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
}

export default Dashboard;
