import { useEffect, useState } from 'react';

function Settings({
  onResetData,
  theme,
  setTheme,
}) {
  const [name, setName] = useState(() => {
    return (
      localStorage.getItem('profitguard-name') ||
      'Caio'
    );
  });

  const [email, setEmail] = useState(() => {
    return (
      localStorage.getItem('profitguard-email') ||
      'caio@profitguard.com'
    );
  });

  const [notifications, setNotifications] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'profitguard-notifications'
        );

      return saved === null
        ? true
        : JSON.parse(saved);
    });

  useEffect(() => {
    localStorage.setItem(
      'profitguard-name',
      name
    );
  }, [name]);

  useEffect(() => {
    localStorage.setItem(
      'profitguard-email',
      email
    );
  }, [email]);

  useEffect(() => {
    localStorage.setItem(
      'profitguard-notifications',
      JSON.stringify(notifications)
    );
  }, [notifications]);

  const handleSubmit = (event) => {
    event.preventDefault();

    localStorage.setItem(
      'profitguard-name',
      name
    );

    localStorage.setItem(
      'profitguard-email',
      email
    );

    localStorage.setItem(
      'profitguard-notifications',
      JSON.stringify(notifications)
    );

    window.alert(
      'Configurações salvas com sucesso!'
    );
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Isso vai apagar suas alterações e restaurar os dados de demonstração. Deseja continuar?'
    );

    if (!confirmed) {
      return;
    }

    onResetData();
  };

  return (
    <section className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Configurações</h2>
          <p>
            Gerencie seu perfil e as preferências
            do ProfitGuard
          </p>
        </div>
      </div>
      <form
        className="settings-content"
        onSubmit={handleSubmit}
      >
        <div className="settings-section">
          <div className="settings-section-header">
            <h3>Perfil</h3>
            <p>
              Informações básicas do administrador
            </p>
          </div>
          <div className="settings-grid">
            <div className="settings-field">
              <label htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>
            <div className="settings-field">
              <label htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>
          </div>
        </div>
        <div className="settings-section">
          <div className="settings-section-header">
            <h3>Preferências</h3>
            <p>
              Personalize a experiência do dashboard
            </p>
          </div>
          <div className="settings-option">
            <div>
              <strong>
                Tema do sistema
              </strong>
              <p>
                Escolha entre o modo claro e o modo
                escuro.
              </p>
            </div>
            <select
              className="theme-select"
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value)
              }
            >
              <option value="light">
                Claro
              </option>
              <option value="dark">
                Escuro
              </option>
            </select>
          </div>
          <div className="settings-option">
            <div>
              <strong>
                Notificações financeiras
              </strong>
              <p>
                Receba alertas sobre mudanças
                importantes no seu desempenho
                financeiro.
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) =>
                  setNotifications(
                    event.target.checked
                  )
                }
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-section danger-section">
          <div className="settings-section-header">
            <h3>Dados do sistema</h3>
            <p>
              Ferramentas para desenvolvimento
              e demonstração
            </p>
          </div>
          <div className="settings-danger-box">
            <div>
              <strong>
                Restaurar dados de demonstração
              </strong>
              <p>
                Remove suas alterações atuais e
                restaura as transações originais
                do ProfitGuard.
              </p>
            </div>
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
            >
              Restaurar dados
            </button>
          </div>
        </div>
        <div className="settings-actions">
          <button
            type="submit"
            className="submit-button"
          >
            Salvar configurações
          </button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
