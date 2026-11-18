import { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import * as api from './api/client';
import { useApiData } from './hooks/useApiData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TransactionForm from './components/TransactionForm';

import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import Settings from './pages/Settings';
import CashFlowPage from './pages/CashFlowPage';
import MarketGlobalPage from './pages/MarketGlobalPage';
import AccountantsPage from './pages/AccountantsPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import './index.css';
import './pages/moduleStyles.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('profitguard-theme') || 'light');

  const appData = useApiData(Boolean(user));

  useEffect(() => {
    let active = true;

    api.getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      document.body.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('profitguard-theme', theme);
  }, [theme]);

  const handleLogin = useCallback(async (email, password) => {
    const authenticatedUser = await api.login(email, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Mesmo sem resposta do servidor, a interface encerra o acesso local.
    } finally {
      setUser(null);
      setShowTransactionForm(false);
      setEditingTransaction(null);
    }
  }, []);

  const filteredTransactions = appData.transactions.filter((transaction) => {
    if (period === 'all') return true;

    const [day, month, year] = transaction.date.split('/');
    const transactionDate = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    const difference = (today - transactionDate) / (1000 * 60 * 60 * 24);

    return difference >= 0 && difference <= Number(period);
  });

  const handleAddTransaction = async (transaction) => {
    const saved = await appData.addTransaction(transaction);
    if (saved) setShowTransactionForm(false);
  };

  const handleEditTransaction = async (transaction) => {
    const saved = await appData.updateTransaction(transaction);
    if (saved) {
      setEditingTransaction(null);
      setShowTransactionForm(false);
    }
  };

  const handleDeleteTransaction = (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    appData.deleteTransaction(id);
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const handleCloseForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteScheduledCashFlow = (id) => {
    if (!window.confirm('Deseja excluir esta previsão do fluxo de caixa?')) return;
    appData.deleteScheduledCashFlow(id);
  };

  return (
    <BrowserRouter>
      <AppContent
        user={user}
        authLoading={authLoading}
        onLogin={handleLogin}
        onLogout={handleLogout}
        filteredTransactions={filteredTransactions}
        transactions={appData.transactions}
        period={period}
        setPeriod={setPeriod}
        apiLoading={appData.loading}
        apiError={appData.loadError}
        onRetryLoad={appData.reload}
        cashFlowSettings={appData.cashFlowSettings}
        setCashFlowSettings={appData.changeCashFlowSettings}
        scheduledCashFlows={appData.scheduledCashFlows}
        onAddScheduledCashFlow={appData.addScheduledCashFlow}
        onDeleteScheduledCashFlow={handleDeleteScheduledCashFlow}
        onRealizeScheduledCashFlow={appData.realizeScheduledCashFlow}
        onDeleteTransaction={handleDeleteTransaction}
        onEditTransaction={handleEditClick}
        onNewTransaction={handleNewTransaction}
        onResetData={appData.resetTransactions}
        theme={theme}
        setTheme={setTheme}
        showTransactionForm={showTransactionForm}
        editingTransaction={editingTransaction}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleEditTransaction}
        onCloseTransactionForm={handleCloseForm}
      />
    </BrowserRouter>
  );
}

function AppContent({
  user,
  authLoading,
  onLogin,
  onLogout,
  filteredTransactions,
  transactions,
  period,
  setPeriod,
  apiLoading,
  apiError,
  onRetryLoad,
  cashFlowSettings,
  setCashFlowSettings,
  scheduledCashFlows,
  onAddScheduledCashFlow,
  onDeleteScheduledCashFlow,
  onRealizeScheduledCashFlow,
  onDeleteTransaction,
  onEditTransaction,
  onNewTransaction,
  onResetData,
  theme,
  setTheme,
  showTransactionForm,
  editingTransaction,
  onAddTransaction,
  onUpdateTransaction,
  onCloseTransactionForm,
}) {
  const location = useLocation();

  if (location.pathname === '/') {
    return <LandingPage isAuthenticated={Boolean(user)} />;
  }

  if (authLoading) {
    return (
      <div className="app-auth-loading" role="status">
        <span className="login-spinner" />
        <p>Conferindo seu acesso ao ProfitGuard…</p>
      </div>
    );
  }

  if (location.pathname === '/login') {
    if (user) return <Navigate to="/dashboard" replace />;
    return <LoginPage onLogin={onLogin} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Header user={user} onLogout={onLogout} />

        {apiError && (
          <div className="api-status-banner api-status-error" role="alert">
            <span>{apiError}</span>
            <button type="button" onClick={onRetryLoad}>Tentar novamente</button>
          </div>
        )}

        {apiLoading && !apiError && (
          <div className="api-status-banner" role="status">Carregando dados do banco…</div>
        )}

        <Routes>
          <Route
            path="/dashboard"
            element={(
              <Dashboard
                transactions={filteredTransactions}
                period={period}
                setPeriod={setPeriod}
                cashFlowSettings={cashFlowSettings}
                scheduledCashFlows={scheduledCashFlows}
                onDelete={onDeleteTransaction}
                onEdit={onEditTransaction}
                onNewTransaction={onNewTransaction}
              />
            )}
          />
          <Route
            path="/transacoes"
            element={(
              <TransactionsPage
                transactions={filteredTransactions}
                onDelete={onDeleteTransaction}
                onEdit={onEditTransaction}
                onNewTransaction={onNewTransaction}
              />
            )}
          />
          <Route path="/relatorios" element={<ReportsPage transactions={filteredTransactions} />} />
          <Route
            path="/fluxo-caixa"
            element={(
              <CashFlowPage
                transactions={transactions}
                settings={cashFlowSettings}
                scheduledItems={scheduledCashFlows}
                onSettingsChange={setCashFlowSettings}
                onAddScheduledItem={onAddScheduledCashFlow}
                onDeleteScheduledItem={onDeleteScheduledCashFlow}
                onRealizeScheduledItem={onRealizeScheduledCashFlow}
              />
            )}
          />
          <Route path="/mercado-global" element={<MarketGlobalPage transactions={transactions} />} />
          <Route path="/contadores" element={<AccountantsPage transactions={transactions} />} />
          <Route path="/configuracoes" element={<Settings onResetData={onResetData} theme={theme} setTheme={setTheme} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {showTransactionForm && (
        <TransactionForm
          transaction={editingTransaction}
          onAdd={onAddTransaction}
          onEdit={onUpdateTransaction}
          onClose={onCloseTransactionForm}
        />
      )}
    </div>
  );
}

export default App;
