// Cliente do back-end ProfitGuard (Spring Boot + H2/PostgreSQL).
// Converte os dados da API para o formato que as telas já usam:
//   - data da transação: API "2026-08-17"  <->  tela "17/08/2026"
//   - ids: texto (ex.: "aB3x9...")

// No Vercel, a API Spring Boot é acessada pelo proxy /backend-api.
// Em desenvolvimento local, o Vite conversa diretamente com o Spring Boot.
const BASE_URL = (
  import.meta.env.PROD
    ? '/backend-api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:8080')
).replace(/\/+$/, '');
let csrfToken = '';

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: Object.keys(headers).length ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // resposta sem corpo JSON
  }

  if (!response.ok) {
    const detalhes = data?.campos ? ` (${Object.values(data.campos).join('; ')})` : '';
    throw new Error(`${data?.erro || data?.message || data?.mensagem || `Erro ${response.status}`}${detalhes}`);
  }
  return data;
}

// ---------- autenticação

async function refreshCsrfToken() {
  const result = await request('/api/auth/csrf');
  csrfToken = result.token;
}

export async function login(email, password) {
  await refreshCsrfToken();
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function getCurrentUser() {
  const user = await request('/api/auth/me');
  await refreshCsrfToken();
  return user;
}

export async function logout() {
  if (!csrfToken) await refreshCsrfToken();
  await request('/api/auth/logout', { method: 'POST' });
  csrfToken = '';
}

// ---------- conversões

export function isoToBr(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function fromApiTransaction(item) {
  return {
    id: item.id,
    description: item.description,
    category: item.category,
    date: isoToBr(item.date),
    value: Number(item.value),
    type: item.type,
  };
}

// A tela entrega a data como "yyyy-MM-dd" (campo <input type="date">), que é o que a API espera.
function toApiTransaction(item) {
  return {
    description: item.description,
    category: item.category,
    date: item.date,
    value: Number(item.value),
    type: item.type,
  };
}

export function fromApiSettings(settings) {
  return {
    startingBalance: settings.startingBalance == null ? '' : String(settings.startingBalance),
    reserveAmount: String(settings.reserveAmount ?? 0),
  };
}

export function toApiSettings(settings) {
  const starting = settings.startingBalance;
  const reserve = Number(settings.reserveAmount);
  return {
    startingBalance: starting === '' || starting == null || !Number.isFinite(Number(starting)) ? null : Number(starting),
    reserveAmount: Number.isFinite(reserve) && reserve > 0 ? reserve : 0,
  };
}

function fromApiScheduled(item) {
  return {
    id: item.id,
    description: item.description,
    amount: Number(item.amount),
    type: item.type,
    dueDate: item.dueDate,
  };
}

function toApiScheduled(item) {
  return {
    description: item.description,
    amount: Number(item.amount),
    type: item.type,
    dueDate: item.dueDate,
  };
}

// ---------- transações

export async function listTransactions() {
  return (await request('/api/transactions')).map(fromApiTransaction);
}

export async function createTransaction(item) {
  return fromApiTransaction(await request('/api/transactions', { method: 'POST', body: toApiTransaction(item) }));
}

export async function updateTransaction(item) {
  return fromApiTransaction(
    await request(`/api/transactions/${encodeURIComponent(item.id)}`, { method: 'PUT', body: toApiTransaction(item) })
  );
}

export async function deleteTransaction(id) {
  await request(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** ATENÇÃO: apaga TODAS as transações e recarrega as de demonstração. */
export async function resetTransactions() {
  return (await request('/api/transactions/reset', { method: 'POST' })).map(fromApiTransaction);
}

// ---------- fluxo de caixa

export async function getCashFlowSettings() {
  return fromApiSettings(await request('/api/cashflow/settings'));
}

export async function saveCashFlowSettings(settings) {
  return fromApiSettings(await request('/api/cashflow/settings', { method: 'PUT', body: toApiSettings(settings) }));
}

export async function listScheduled() {
  return (await request('/api/cashflow/scheduled')).map(fromApiScheduled);
}

export async function createScheduled(item) {
  return fromApiScheduled(await request('/api/cashflow/scheduled', { method: 'POST', body: toApiScheduled(item) }));
}

export async function deleteScheduled(id) {
  await request(`/api/cashflow/scheduled/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Dá baixa: o back-end cria a transação de hoje e remove o previsto. Devolve a transação criada. */
export async function realizeScheduled(id) {
  return fromApiTransaction(await request(`/api/cashflow/scheduled/${encodeURIComponent(id)}/realize`, { method: 'POST' }));
}

// ---------- contadores

export async function listAccountants() {
  return request('/api/accountants');
}

export async function createAccountant(form) {
  return request('/api/accountants', {
    method: 'POST',
    body: {
      name: form.name,
      company: form.company,
      specialty: form.specialty,
      region: form.region,
      email: form.email,
      whatsapp: form.whatsapp,
      notes: form.notes,
    },
  });
}

export async function deleteAccountant(id) {
  await request(`/api/accountants/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
