import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../ai/cashFlowTools';
import { createAccountant, deleteAccountant, listAccountants } from '../api/client';
import './AccountantsPage.css';

const emptyForm = {
  name: '',
  company: '',
  specialty: 'Contabilidade empresarial',
  region: '',
  email: '',
  whatsapp: '',
  notes: '',
};

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function buildFinancialSummary(transactions) {
  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const byCategory = {};
  transactions.filter((item) => item.type === 'expense').forEach((item) => {
    const category = item.category || 'Sem categoria';
    byCategory[category] = (byCategory[category] || 0) + (Number(item.value) || 0);
  });
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return [
    'RESUMO FINANCEIRO — PROFITGUARD',
    `Transações registradas: ${transactions.length}`,
    `Entradas registradas: ${formatCurrency(income)}`,
    `Saídas registradas: ${formatCurrency(expenses)}`,
    `Resultado do histórico (entradas - saídas): ${formatCurrency(income - expenses)}`,
    '',
    'Principais categorias de saída:',
    ...(topCategories.length ? topCategories.map(([category, amount]) => `- ${category}: ${formatCurrency(amount)}`) : ['- Nenhuma saída cadastrada']),
    '',
    'Observação: este é um resumo das transações cadastradas no ProfitGuard, não uma demonstração contábil oficial nem garantia do saldo bancário atual.',
  ].join('\n');
}

function AccountantsPage({ transactions = [] }) {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const summary = useMemo(() => buildFinancialSummary(transactions), [transactions]);

  useEffect(() => {
    let cancelled = false;
    listAccountants()
      .then((list) => {
        if (!cancelled) setContacts(list);
      })
      .catch((err) => {
        if (!cancelled) setNotice(`Não foi possível carregar os contatos: ${err.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Informe o nome do contador ou escritório.');
      return;
    }
    if (!form.email.trim() && !normalizePhone(form.whatsapp)) {
      setError('Informe um e-mail ou WhatsApp para permitir o contato.');
      return;
    }

    try {
      const saved = await createAccountant(form);
      setContacts((current) => [saved, ...current]);
      setForm(emptyForm);
      setError('');
      setNotice('Contato salvo.');
      setShowForm(false);
    } catch (err) {
      setError(`Não foi possível salvar o contato: ${err.message}`);
    }
  };

  const removeContact = async (contact) => {
    if (!window.confirm(`Remover o contato ${contact.name}?`)) return;
    try {
      await deleteAccountant(contact.id);
      setContacts((current) => current.filter((item) => item.id !== contact.id));
    } catch (err) {
      setNotice(`Não foi possível remover o contato: ${err.message}`);
    }
  };

  const requestContact = (contact) => {
    const message = `Olá, ${contact.name}! Encontrei seu contato no ProfitGuard e gostaria de conversar sobre uma análise contábil para minha empresa.`;
    const phone = normalizePhone(contact.whatsapp);
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (contact.email) {
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Contato pelo ProfitGuard')}&body=${encodeURIComponent(message)}`;
    }
  };

  const sendSummaryByEmail = (contact) => {
    if (!contact.email) {
      setNotice('Este contato não possui e-mail cadastrado. Use o WhatsApp ou edite o contato.');
      return;
    }
    const body = `${summary}\n\nGostaria de solicitar uma análise deste resumo. Podemos conversar?`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Resumo financeiro — ProfitGuard')}&body=${encodeURIComponent(body)}`;
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setNotice('Resumo financeiro copiado. Revise as informações antes de compartilhar.');
    } catch {
      setNotice('Não foi possível copiar automaticamente neste navegador. Use o botão de e-mail de um contato cadastrado.');
    }
  };

  return (
    <section className="module-page accountants-page">
      <div className="module-page-header">
        <div>
          <span className="module-eyebrow">REDE DE ESPECIALISTAS</span>
          <h2>Contadores</h2>
          <p>Organize contatos contábeis e compartilhe um resumo do histórico financeiro quando precisar de orientação profissional.</p>
        </div>
        <button className="module-primary-button" type="button" onClick={() => { setShowForm((value) => !value); setError(''); }}>
          {showForm ? 'Fechar formulário' : '+ Adicionar contato'}
        </button>
      </div>
      <div className="accountants-privacy-note">
        <span>🔒</span>
        <div>
          <strong>Você controla o que compartilha</strong>
          <p>Os contatos cadastrados ficam salvos no banco de dados do ProfitGuard. O ProfitGuard não envia os seus dados financeiros automaticamente; o resumo só é incluído quando você escolhe enviá-lo por e-mail. Esta versão ainda não possui diretório público de profissionais nem mensagens internas.</p>
        </div>
      </div>
      {notice && <div className="accountants-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')}>Fechar</button></div>}
      {showForm && (
        <form className="accountants-form" onSubmit={handleSubmit}>
          <div className="accountants-form-heading">
            <div><h3>Novo contato contábil</h3><p>Cadastre um profissional que você já conhece ou deseja contatar.</p></div>
          </div>
          <div className="accountants-form-grid">
            <label>Nome do profissional*<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome e sobrenome" /></label>
            <label>Escritório/empresa<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Nome do escritório" /></label>
            <label>Especialidade<select value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })}><option>Contabilidade empresarial</option><option>MEI e microempresas</option><option>Tributação e fiscal</option><option>Folha de pagamento</option><option>Comércio exterior</option><option>Planejamento financeiro</option><option>Outra especialidade</option></select></label>
            <label>Região/cidade<input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} placeholder="Ex.: Sorocaba - SP" /></label>
            <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="contador@email.com" /></label>
            <label>WhatsApp com DDD<input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="Ex.: +55 15 99999-9999" /></label>
            <label className="accountants-full-field">Observações<input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Horário de atendimento, indicação, especialidade…" /></label>
          </div>
          {error && <p className="accountants-form-error">{error}</p>}
          <div className="accountants-form-actions"><button className="module-secondary-button" type="button" onClick={() => { setShowForm(false); setError(''); }}>Cancelar</button><button className="module-primary-button" type="submit">Salvar contato</button></div>
        </form>
      )}
      <div className="accountants-toolbar">
        <div><h3>Seus contatos</h3><p>{contacts.length} profissional(is) salvo(s)</p></div>
        <button className="module-secondary-button" type="button" onClick={copySummary}>📋 Copiar resumo financeiro</button>
      </div>
      {contacts.length === 0 ? (
        <div className="accountants-empty-state">
          <div className="accountants-empty-icon">👨‍💼</div>
          <h3>Seu espaço de contatos começa aqui</h3>
          <p>Adicione um contador ou escritório para guardar os canais de contato e enviar um resumo financeiro quando necessário.</p>
          <button className="module-primary-button" type="button" onClick={() => setShowForm(true)}>Cadastrar primeiro contato</button>
        </div>
      ) : (
        <div className="accountants-contact-grid">
          {contacts.map((contact) => (
            <article className="accountants-contact-card" key={contact.id}>
              <div className="accountants-contact-top"><div className="accountants-avatar">{contact.name.trim().slice(0, 1).toUpperCase()}</div><button type="button" className="accountants-delete-button" onClick={() => removeContact(contact)}>Remover</button></div>
              <h4>{contact.name}</h4>
              <p className="accountants-contact-company">{contact.company || 'Profissional independente'}</p>
              <span className="accountants-specialty">{contact.specialty}</span>
              {contact.region && <p className="accountants-contact-meta">📍 {contact.region}</p>}
              {contact.email && <p className="accountants-contact-meta">✉️ {contact.email}</p>}
              {contact.whatsapp && <p className="accountants-contact-meta">📱 {contact.whatsapp}</p>}
              {contact.notes && <p className="accountants-contact-notes">{contact.notes}</p>}
              <div className="accountants-contact-actions">
                <button type="button" className="module-primary-button" onClick={() => requestContact(contact)}>Solicitar contato</button>
                <button type="button" className="module-secondary-button" onClick={() => sendSummaryByEmail(contact)} disabled={!contact.email}>Enviar resumo por e-mail</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="accountants-summary-preview">
        <div><span>PRÉVIA DE COMPARTILHAMENTO</span><h3>Resumo que pode ser enviado</h3><p>Entradas, saídas e principais categorias extraídas das transações cadastradas.</p></div>
        <pre>{summary}</pre>
        <small>O resultado do histórico pode não representar o lucro contábil nem o saldo bancário. Um contador deve validar os documentos e a classificação.</small>
      </div>
    </section>
  );
}

export default AccountantsPage;
