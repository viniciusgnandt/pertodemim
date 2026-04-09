import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, LayoutDashboard, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={22} />
        <span>Início</span>
      </NavLink>

      <NavLink to="/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Search size={22} />
        <span>Buscar</span>
      </NavLink>

      {isOwner && (
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} />
          <span>Dashboard</span>
        </NavLink>
      )}

      {user ? (
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <div className="bottom-nav-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{user.name[0].toUpperCase()}</span>
            }
          </div>
          <span>Perfil</span>
        </NavLink>
      ) : (
        <button className="bottom-nav-item" onClick={() => navigate('/login')}>
          <LogIn size={22} />
          <span>Entrar</span>
        </button>
      )}
    </nav>
  );
}
