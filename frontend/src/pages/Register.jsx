import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Mail, Lock, User, Eye, EyeOff, Store, ShoppingBag } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'consumer' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Senha deve ter no mínimo 6 caracteres');
    }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Conta criada! Bem-vindo, ${user.name.split(' ')[0]}!`);
      navigate(form.role === 'owner' ? '/dashboard' : '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <MapPin size={28} />
          <span>PertoDeMim</span>
        </div>

        <h1 className="auth-title">Criar conta grátis</h1>
        <p className="auth-subtitle">Junte-se a milhares de pessoas em Mogi das Cruzes</p>

        {/* Role selector */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${form.role === 'consumer' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, role: 'consumer' }))}
          >
            <ShoppingBag size={20} />
            <span>Sou Consumidor</span>
            <small>Busco produtos</small>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === 'owner' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, role: 'owner' }))}
          >
            <Store size={20} />
            <span>Sou Proprietário</span>
            <small>Tenho estabelecimento</small>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-input-icon" />
              <input
                type="text"
                name="name"
                className="form-input auth-input"
                placeholder="Seu nome"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                name="email"
                className="form-input auth-input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                className="form-input auth-input"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? <><div className="spinner" /> Criando conta...</> : 'Criar conta'}
          </button>
        </form>

        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
