import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  {
    icon: '📊',
    eyebrow: 'VISÃO DO NEGÓCIO',
    title: 'Seus números em um só lugar',
    description: 'Organize receitas, despesas e movimentações e acompanhe os principais indicadores sem ficar pulando entre telas.',
    to: '/dashboard',
    link: 'Conhecer o dashboard',
  },
  {
    icon: '💸',
    eyebrow: 'PLANEJAMENTO',
    title: 'Entenda o caminho do seu caixa',
    description: 'Cadastre compromissos futuros, acompanhe o saldo projetado e identifique períodos que merecem atenção.',
    to: '/fluxo-caixa',
    link: 'Explorar fluxo de caixa',
  },
  {
    icon: '🌎',
    eyebrow: 'CONTEXTO EXTERNO',
    title: 'Olhe além da empresa',
    description: 'Consulte notícias econômicas e dados históricos de comércio para investigar possíveis impactos e mercados.',
    to: '/mercado-global',
    link: 'Abrir Mercado Global',
  },
  {
    icon: '🤝',
    eyebrow: 'REDE DE APOIO',
    title: 'Compartilhe informações com especialistas',
    description: 'Organize contatos de contadores e prepare um resumo financeiro para iniciar uma conversa de trabalho.',
    to: '/contadores',
    link: 'Ver área de contadores',
  },
];

const faqs = [
  {
    question: 'O ProfitGuard substitui um contador?',
    answer: 'Não. Ele ajuda a organizar informações e levantar pontos para investigar. Decisões contábeis, fiscais e financeiras importantes devem ser avaliadas com um profissional habilitado.',
  },
  {
    question: 'A IA garante que uma previsão vai acontecer?',
    answer: 'Não. A IA ajuda a interpretar os dados disponíveis. Projeções dependem das informações cadastradas, e acontecimentos externos podem mudar. Confira as fontes e valide os dados antes de decidir.',
  },
  {
    question: 'Preciso preencher tudo para começar?',
    answer: 'Não. Você pode começar registrando suas transações. Para projeções de caixa mais úteis, informe também seu saldo disponível e os recebimentos e pagamentos previstos.',
  },
];

function Brand({ compact = false }) {
  return (
    <Link className={`landing-brand${compact ? ' landing-brand-compact' : ''}`} to="/" aria-label="ProfitGuard, página inicial">
      <span className="landing-brand-symbol" aria-hidden="true">P</span>
      <span className="landing-brand-name">Profit<span>Guard</span></span>
    </Link>
  );
}

function DashboardPreview() {
  const bars = [34, 48, 41, 62, 52, 70, 60, 83, 72, 92, 76, 100];

  return (
    <div className="landing-preview-wrap" aria-label="Prévia ilustrativa do painel financeiro">
      <div className="landing-preview-glow" />
      <div className="landing-preview-window">
        <div className="landing-preview-topbar">
          <div className="landing-preview-dots" aria-hidden="true"><span /><span /><span /></div>
          <span>Visão geral</span>
          <span className="landing-preview-period">Últimos 30 dias⌄</span>
        </div>
        <div className="landing-preview-content">
          <div className="landing-preview-heading">
            <div>
              <span className="landing-overline">RESUMO FINANCEIRO</span>
              <h2>Seu negócio, de perto.</h2>
            </div>
            <span className="landing-preview-status"><i /> Visão de exemplo</span>
          </div>
          <div className="landing-preview-metrics">
            <div className="landing-preview-metric">
              <span>Receitas</span>
              <strong>R$ 48.250</strong>
              <small className="is-positive">↗ Entradas registradas</small>
            </div>
            <div className="landing-preview-metric">
              <span>Despesas</span>
              <strong>R$ 31.740</strong>
              <small>Saídas registradas</small>
            </div>
            <div className="landing-preview-metric landing-preview-metric-highlight">
              <span>Lucro calculado</span>
              <strong>R$ 16.510</strong>
              <small>Receitas − despesas</small>
            </div>
          </div>
          <div className="landing-preview-bottom">
            <div className="landing-preview-chart-card">
              <div className="landing-preview-chart-title"><div><strong>Movimentação</strong><small>Exemplo de visualização</small></div><span>● Receitas&nbsp;&nbsp; ● Despesas</span></div>
              <div className="landing-chart-area" aria-hidden="true">
                <div className="landing-chart-grid"><span /><span /><span /><span /></div>
                <div className="landing-chart-bars">
                  {bars.map((height, index) => (
                    <div className="landing-chart-bar-group" key={height + index}>
                      <span className="landing-chart-bar-income" style={{ height: `${height}%` }} />
                      <span className="landing-chart-bar-expense" style={{ height: `${Math.max(18, height * 0.62)}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="landing-preview-insight">
              <span className="landing-insight-icon" aria-hidden="true">✦</span>
              <div>
                <strong>ProfitGuard AI</strong>
                <p>Compare receitas, despesas e compromissos antes de tomar uma decisão.</p>
              </div>
              <span className="landing-insight-arrow" aria-hidden="true">↗</span>
            </div>
          </div>
          <div className="landing-preview-footnote">Prévia ilustrativa · valores fictícios, não são dados de uma conta real.</div>
        </div>
      </div>
      <div className="landing-float-note"><span>✓</span><div><strong>Mais clareza no dia a dia</strong><small>Dados organizados para apoiar decisões</small></div></div>
    </div>
  );
}

function LandingPage({ isAuthenticated = false }) {
  const entryPath = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Brand />
          <nav className="landing-nav" aria-label="Navegação da página inicial">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div className="landing-header-actions">
            <Link className="landing-login-link" to={entryPath}>Entrar no sistema</Link>
            <Link className="landing-button landing-button-small" to={entryPath}>Acessar dashboard <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-grid" aria-hidden="true" />
          <div className="landing-container landing-hero-layout">
            <div className="landing-hero-copy">
              <div className="landing-kicker"><span className="landing-kicker-dot" /> Gestão financeira com visão mais ampla</div>
              <h1>Entenda seus números.<br /><span>Planeje o próximo passo.</span></h1>
              <p className="landing-hero-description">O ProfitGuard reúne suas movimentações financeiras, o planejamento de caixa e sinais do mercado em um só lugar — com análises por IA para ajudar você a fazer perguntas melhores sobre o seu negócio.</p>
              <div className="landing-hero-actions">
                <Link className="landing-button landing-button-primary" to={entryPath}>Acessar o ProfitGuard <span aria-hidden="true">→</span></Link>
                <a className="landing-button landing-button-ghost" href="#recursos"><span className="landing-play-icon" aria-hidden="true">↓</span> Conhecer os recursos</a>
              </div>
              <div className="landing-hero-points">
                <span><i>✓</i> Receitas e despesas</span>
                <span><i>✓</i> Projeções de caixa</span>
                <span><i>✓</i> Contexto de mercado</span>
              </div>
              <p className="landing-hero-note">Comece com os dados que você já tem e complemente as informações aos poucos.</p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section className="landing-trust-strip" aria-label="Visão geral dos recursos">
          <div className="landing-container landing-trust-inner">
            <p>Uma visão integrada para a rotina do negócio</p>
            <div><span>01</span> Organizar</div>
            <div><span>02</span> Acompanhar</div>
            <div><span>03</span> Investigar</div>
            <div><span>04</span> Planejar</div>
          </div>
        </section>

        <section className="landing-section landing-features" id="recursos">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span className="landing-section-kicker">O QUE VOCÊ ENCONTRA</span>
              <h2>Mais do que um painel de números.</h2>
              <p>Ferramentas que se complementam para você sair do registro do passado e começar a planejar o que vem pela frente.</p>
            </div>
            <div className="landing-feature-grid">
              {features.map((feature, index) => (
                <article className="landing-feature-card" key={feature.to}>
                  <div className="landing-feature-card-top"><span className="landing-feature-icon" aria-hidden="true">{feature.icon}</span><span className="landing-feature-number">0{index + 1}</span></div>
                  <span className="landing-feature-eyebrow">{feature.eyebrow}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link to={feature.to} className="landing-text-link">{feature.link} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-ai-section">
          <div className="landing-container landing-ai-layout">
            <div className="landing-ai-art" aria-hidden="true">
              <div className="landing-orbit landing-orbit-one" />
              <div className="landing-orbit landing-orbit-two" />
              <div className="landing-ai-center"><span>PG</span><small>AI</small></div>
              <div className="landing-ai-node landing-ai-node-one">↗</div>
              <div className="landing-ai-node landing-ai-node-two">⌁</div>
              <div className="landing-ai-node landing-ai-node-three">◎</div>
            </div>
            <div className="landing-ai-copy">
              <span className="landing-section-kicker">INTELIGÊNCIA COMO APOIO</span>
              <h2>Faça perguntas. Investigue os sinais. Decida com mais contexto.</h2>
              <p>O ProfitGuard AI pode explicar indicadores, comparar períodos e ajudar a investigar alertas financeiros. Quando disponíveis, informações externas também entram na análise para ampliar o contexto.</p>
              <div className="landing-ai-list">
                <div><span>01</span><p><strong>Parte dos seus dados</strong><small>Transações, despesas e compromissos cadastrados no sistema.</small></p></div>
                <div><span>02</span><p><strong>Aponta o que merece atenção</strong><small>Variações e sinais para você investigar, sem inventar causas.</small></p></div>
                <div><span>03</span><p><strong>Explica limites e incertezas</strong><small>Notícias e projeções apoiam a análise, mas não garantem resultados.</small></p></div>
              </div>
              <Link className="landing-button landing-button-light" to={entryPath}>Conhecer o ProfitGuard AI <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="landing-section landing-how" id="como-funciona">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-centered">
              <span className="landing-section-kicker">COMO FUNCIONA</span>
              <h2>Comece simples. Ganhe clareza passo a passo.</h2>
              <p>O valor das análises depende da qualidade e da atualização das informações cadastradas.</p>
            </div>
            <div className="landing-steps">
              <article><span className="landing-step-number">1</span><h3>Registre</h3><p>Adicione receitas e despesas ou revise as transações de exemplo antes de usar os indicadores como referência.</p></article>
              <div className="landing-step-connector" aria-hidden="true">→</div>
              <article><span className="landing-step-number">2</span><h3>Planeje</h3><p>Informe o saldo disponível e cadastre pagamentos e recebimentos futuros no Fluxo de Caixa.</p></article>
              <div className="landing-step-connector" aria-hidden="true">→</div>
              <article><span className="landing-step-number">3</span><h3>Investigue</h3><p>Use os indicadores, notícias e perguntas à IA para identificar o que precisa de uma análise mais cuidadosa.</p></article>
            </div>
          </div>
        </section>

        <section className="landing-faq" id="duvidas">
          <div className="landing-container landing-faq-layout">
            <div className="landing-faq-intro">
              <span className="landing-section-kicker">ANTES DE COMEÇAR</span>
              <h2>Transparência também faz parte da gestão.</h2>
              <p>O ProfitGuard é uma ferramenta de apoio. Ele organiza dados e ajuda a investigar possibilidades; não substitui a validação profissional nem garante o resultado de uma decisão.</p>
              <Link to={entryPath} className="landing-text-link">Abrir o sistema <span aria-hidden="true">→</span></Link>
            </div>
            <div className="landing-faq-list">
              {faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}<span aria-hidden="true">+</span></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-cta-inner">
            <div><span className="landing-section-kicker">UM PRÓXIMO PASSO MAIS CLARO</span><h2>Organize sua visão financeira em um só lugar.</h2><p>Entre no ProfitGuard para explorar o painel, registrar movimentações e começar seu planejamento.</p></div>
            <Link className="landing-button landing-button-primary" to={entryPath}>Entrar no ProfitGuard <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div><Brand compact /><p>Clareza para acompanhar. Contexto para planejar.</p></div>
          <div className="landing-footer-links"><Link to={entryPath}>Dashboard</Link><Link to="/fluxo-caixa">Fluxo de Caixa</Link><Link to="/mercado-global">Mercado Global</Link><Link to="/contadores">Contadores</Link></div>
          <span className="landing-copyright">© {new Date().getFullYear()} ProfitGuard</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
