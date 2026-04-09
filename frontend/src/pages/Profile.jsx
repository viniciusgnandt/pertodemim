import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, User } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isOwner = user?.role === 'owner' || user?.role === 'admin';

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
        <span className="profile-role-badge">
          {isOwner ? '🏪 Estabelecimento' : '👤 Consumidor'}
        </span>
      </div>

      <div className="profile-actions">
        {isOwner && (
          <button className="profile-action-btn" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} />
            <div>
              <strong>Dashboard</strong>
              <span>Gerencie seu estabelecimento</span>
            </div>
          </button>
        )}

        <button className="profile-action-btn profile-action-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <div>
            <strong>Sair da conta</strong>
            <span>Encerrar sessão</span>
          </div>
        </button>
      </div>
    </div>
  );
}
