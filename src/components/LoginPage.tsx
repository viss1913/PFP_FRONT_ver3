import React, { useState } from 'react';
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('testuser@example.com');
    const [password, setPassword] = useState('Test1234');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('https://pfpbackend-production.up.railway.app/api/auth/login', {
                email,
                password
            });

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                // Also store user info if available, but for now token is enough
                onLoginSuccess();
            } else {
                alert('Ошибка: Токен не получен от сервера');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Неверный email или пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="premium-card"
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 0 20px rgba(255, 199, 80, 0.3)'
                    }}>
                        <LogIn size={32} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Добро пожаловать</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Введите ваши данные для входа в систему PFP</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Электронная почта</label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Пароль</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                        {loading ? 'Вход...' : 'Войти в кабинет'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Тестовый аккаунт: <br />
                        <span style={{ color: 'var(--primary)' }}>testuser@example.com / Test1234</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
