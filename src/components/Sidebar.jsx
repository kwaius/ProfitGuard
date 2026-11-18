import { NavLink } from 'react-router-dom';

function Sidebar() {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { to: '/transacoes', label: 'Transações', icon: '💳' },
    { to: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: '💰' },
    { to: '/relatorios', label: 'Relatórios', icon: '📈' },
    { to: '/mercado-global', label: 'Mercado Global', icon: '🌎' },
    { to: '/contadores', label: 'Contadores', icon: '👨‍💼' },
    { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">ProfitGuard</div>
      <nav className="menu" aria-label="Navegação principal">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-link-icon" aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">Inteligência para decisões melhores</div>
    </aside>
  );
}

export default Sidebar;
