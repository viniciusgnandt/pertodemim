import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="profile-page page-enter">
      <div className="profile-header">
        <div className="profile-avatar-lg">
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} />
            : <span>{user?.name?.[0]?.toUpperCase()}</span>
          }
        </div>
        <h2 className="profile-name">{user?.name}</h2>
        <p className="profile-email">{user?.email}</p>
        <span className="profile-role-badge">🏪 Estabelecimento</span>
      </div>

      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => navigate('/dashboard')}>
          <div className="profile-action-icon"><LayoutDashboard size={20} /></div>
          <div>
            <strong>Dashboard</strong>
            <span>Gerencie seu estabelecimento</span>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-light)', marginLeft: 'auto' }} />
        </button>

        <button className="profile-action-btn profile-action-logout" onClick={handleLogout}>
          <div className="profile-action-icon"><LogOut size={20} /></div>
          <div>
            <strong>Sair da conta</strong>
            <span>Encerrar sessão</span>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--red)', marginLeft: 'auto', opacity: 0.5 }} />
        </button>
      </div>
    </div>
  );
}
