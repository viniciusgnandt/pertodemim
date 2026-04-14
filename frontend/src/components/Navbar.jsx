import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Search, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <MapPin size={18} strokeWidth={2.5} />
          </div>
          <span>Perto<strong>DeMim</strong></span>
        </Link>

        {/* Search bar - desktop */}
        <form onSubmit={handleSearch} className="navbar-search">
          <Search size={16} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Buscar produtos ou estabelecimentos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        {/* Desktop nav links */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-menu-wrapper">
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <div className="user-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} />
                    : <span>{user.name[0].toUpperCase()}</span>
                  }
                </div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <p className="user-menu-name">{user.name}</p>
                    <p className="user-menu-email">{user.email}</p>
                  </div>
                  {(user.role === 'owner' || user.role === 'admin') && (
                    <Link
                      to="/dashboard"
                      className="user-menu-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                  )}
                  <button className="user-menu-item user-menu-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Cadastrar</Link>
            </>
          )}

          <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="navbar-mobile">
          <form onSubmit={handleSearch} className="navbar-mobile-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>
          {user ? (
            <>
              <div className="navbar-mobile-user">
                <User size={16} />
                <span>{user.name}</span>
              </div>
              {(user.role === 'owner' || user.role === 'admin') && (
                <Link to="/dashboard" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              )}
              <button className="navbar-mobile-link navbar-mobile-logout" onClick={handleLogout}>
                <LogOut size={16} />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>Entrar</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Cadastrar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
