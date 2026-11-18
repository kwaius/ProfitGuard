import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const DEMO_EMAIL = 'demo@profitguard.com';
const DEMO_PASSWORD = 'Profit@12345';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const showDemoAccess = import.meta.env.DEV;
  const [email, setEmail] = useState(showDemoAccess ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(showDemoAccess ? DEMO_PASSWORD : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email.trim(), password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Não foi possível entrar. Confira seus dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <main className="login-page">
      <section className="login-showcase">
        <Link className="login-brand" to="/" aria-label="Voltar para a página inicial">
          <span className="login-brand-mark">P</span>
          <span>Profit<span>Guard</span></span>
        </Link>

        <div className="login-showcase-copy">
          <span className="login-eyebrow"><i /> GESTÃO COM MAIS CONTEXTO</span>
          <h1>Suas finanças,<br /><span>mais claras.</span></h1>
          <p>Acompanhe movimentações, organize compromissos futuros e use análises para entender melhor o que acontece no seu negócio.</p>
          <div className="login-benefits">
            <div><span>✓</span><p><strong>Visão financeira</strong><small>Receitas, despesas e indicadores em um só lugar.</small></p></div>
            <div><span>✓</span><p><strong>Planejamento de caixa</strong><small>Compromissos e projeções com base nos dados cadastrados.</small></p></div>
            <div><span>✓</span><p><strong>ProfitGuard AI</strong><small>Uma ajuda para interpretar informações e investigar cenários.</small></p></div>
          </div>
        </div>

        <div className="login-showcase-footer">
          <span>Clareza para acompanhar. Contexto para planejar.</span>
          <span>© {new Date().getFullYear()} ProfitGuard</span>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-form-wrap">
          <Link to="/" className="login-back-link">← Voltar ao site</Link>
          <div className="login-card">
            <div className="login-card-heading">
              <span className="login-card-icon">↗</span>
              <span className="login-card-label">ÁREA DO USUÁRIO</span>
              <h2>Bem-vindo de volta</h2>
              <p>Entre com seus dados para acessar o ProfitGuard.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com"
                required
              />

              <div className="login-password-label">
                <label htmlFor="login-password">Senha</label>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                required
              />

              {error && <div className="login-error" role="alert">{error}</div>}

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? <><span className="login-spinner" /> Entrando...</> : <>Entrar no sistema <span>→</span></>}
              </button>
            </form>

            {showDemoAccess && (
              <div className="login-demo-box">
                <div className="login-demo-heading"><span>✦</span><div><strong>Acesso para demonstração</strong><small>Conta já cadastrada no banco local</small></div></div>
                <div className="login-demo-credentials"><span>E-mail <strong>{DEMO_EMAIL}</strong></span><span>Senha <strong>{DEMO_PASSWORD}</strong></span></div>
                <button type="button" onClick={fillDemoAccount}>Preencher dados de demonstração</button>
              </div>
            )}
          </div>
          <p className="login-security-note">🔒 Acesso protegido pelo servidor do ProfitGuard.</p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
