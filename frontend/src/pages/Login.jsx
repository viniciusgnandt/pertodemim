import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bem-vindo, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'owner' || user.role === 'admin' ? '/dashboard' : from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;
  };

  const fillDemo = (role) => {
    if (role === 'owner') {
      setEmail('owner@pertodemim.com.br');
      setPassword('demo123456');
    } else {
      setEmail('consumer@pertodemim.com.br');
      setPassword('demo123456');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <MapPin size={28} />
          <span>PertoDeMim</span>
        </div>

        <h1 className="auth-title">Entrar na sua conta</h1>
        <p className="auth-subtitle">Encontre o que você precisa perto de você</p>

        {/* Demo shortcuts */}
        <div className="auth-demo-bar">
          <span>Demo:</span>
          <button className="auth-demo-btn" onClick={() => fillDemo('consumer')}>Consumidor</button>
          <button className="auth-demo-btn" onClick={() => fillDemo('owner')}>Proprietário</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="form-input auth-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input auth-input"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? <><div className="spinner" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider"><span>ou</span></div>

        <button className="auth-social-btn google" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
          Continuar com Google
        </button>

        <button className="auth-social-btn apple" disabled>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M13.5 9.17c-.02-2.04 1.67-3.02 1.74-3.06-0.95-1.38-2.42-1.57-2.94-1.59-1.25-.13-2.44.74-3.08.74-.63 0-1.6-.72-2.63-.7-1.35.02-2.6.79-3.3 2.0-1.41 2.44-.36 6.05 1.01 8.03.67.96 1.46 2.04 2.5 2 1.0-.04 1.38-.65 2.59-.65 1.2 0 1.55.65 2.6.63 1.08-.02 1.76-.97 2.42-1.94.76-1.1 1.07-2.18 1.09-2.24-.02-.01-2.08-.8-2.1-3.16z"/><path d="M11.6 3.17c.56-.68.94-1.62.83-2.56-.8.03-1.77.53-2.34 1.2-.51.59-.97 1.54-.84 2.45.88.07 1.78-.45 2.35-1.09z"/></svg>
          Continuar com Apple (em breve)
        </button>

        <p className="auth-switch">
          Não tem conta? <Link to="/register">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
}
