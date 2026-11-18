function Header({ user, onLogout }) {
  const displayName = user?.name || 'Usuário';
  const firstName = displayName.split(' ')[0];
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="header">
      <div>
        <h1>Olá, {firstName} 👋</h1>
        <p>Confira as informações do seu negócio</p>
      </div>
      <div className="header-account-area">
        <div className="user" title={user?.email || ''}>
          <div className="avatar">{initial}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{user?.role === 'ADMIN' ? 'Administrador' : 'Conta ProfitGuard'}</span>
          </div>
        </div>
        <button className="header-logout-button" type="button" onClick={onLogout} title="Sair da conta">
          <span aria-hidden="true">↪</span>
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
