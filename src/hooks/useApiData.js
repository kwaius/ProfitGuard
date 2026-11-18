import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/client';

const DEFAULT_SETTINGS = { startingBalance: '', reserveAmount: '0' };
const SETTINGS_SAVE_DELAY_MS = 700;

export function useApiData(enabled = true) {
  const [transactions, setTransactions] = useState([]);
  const [cashFlowSettings, setCashFlowSettings] = useState(DEFAULT_SETTINGS);
  const [scheduledCashFlows, setScheduledCashFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const settingsTimer = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    Promise.all([
      api.listTransactions(),
      api.getCashFlowSettings(),
      api.listScheduled(),
    ])
      .then(([loadedTransactions, loadedSettings, loadedScheduled]) => {
        if (cancelled) return;
        setTransactions(loadedTransactions);
        setCashFlowSettings(loadedSettings);
        setScheduledCashFlows(loadedScheduled);
        setLoadError('');
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  useEffect(() => () => clearTimeout(settingsTimer.current), []);

  useEffect(() => {
    if (!enabled) clearTimeout(settingsTimer.current);
  }, [enabled]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const run = async (action) => {
    try {
      return await action();
    } catch (error) {
      window.alert(`Não foi possível concluir a operação: ${error.message}`);
      return null;
    }
  };

  const addTransaction = async (transaction) => {
    const saved = await run(() => api.createTransaction(transaction));
    if (!saved) return false;
    setTransactions((current) => [saved, ...current]);
    return true;
  };

  const updateTransaction = async (transaction) => {
    const saved = await run(() => api.updateTransaction(transaction));
    if (!saved) return false;
    setTransactions((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    return true;
  };

  const deleteTransaction = async (id) => {
    const done = await run(async () => {
      await api.deleteTransaction(id);
      return true;
    });
    if (done) setTransactions((current) => current.filter((item) => item.id !== id));
  };

  const resetTransactions = async () => {
    const restored = await run(() => api.resetTransactions());
    if (restored) setTransactions(restored);
  };

  const changeCashFlowSettings = (nextSettings) => {
    setCashFlowSettings(nextSettings);
    clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => {
      run(() => api.saveCashFlowSettings(nextSettings));
    }, SETTINGS_SAVE_DELAY_MS);
  };

  const addScheduledCashFlow = async (item) => {
    const saved = await run(() => api.createScheduled(item));
    if (saved) setScheduledCashFlows((current) => [saved, ...current]);
  };

  const deleteScheduledCashFlow = async (id) => {
    const done = await run(async () => {
      await api.deleteScheduled(id);
      return true;
    });
    if (done) setScheduledCashFlows((current) => current.filter((item) => item.id !== id));
  };

  const realizeScheduledCashFlow = async (id) => {
    const realized = await run(() => api.realizeScheduled(id));
    if (!realized) return;
    setTransactions((current) => [realized, ...current]);
    setScheduledCashFlows((current) => current.filter((item) => item.id !== id));
  };

  return {
    transactions,
    cashFlowSettings,
    scheduledCashFlows,
    loading,
    loadError,
    reload,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    resetTransactions,
    changeCashFlowSettings,
    addScheduledCashFlow,
    deleteScheduledCashFlow,
    realizeScheduledCashFlow,
  };
}
