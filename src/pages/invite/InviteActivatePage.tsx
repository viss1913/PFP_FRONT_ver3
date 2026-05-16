import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    authApi,
    getActivateInviteErrorMessage,
    type AgentInvitePreviewResponse,
} from '../../api/authApi';

type PagePhase = 'loading' | 'invalid' | 'form' | 'submitting';

function formatInviteeName(preview: AgentInvitePreviewResponse): string {
    const parts = [preview.first_name, preview.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : preview.email ?? 'приглашённый агент';
}

function invalidLinkMessage(preview: AgentInvitePreviewResponse): string {
    if (preview.used) return 'Эта ссылка уже была использована. Войдите в кабинет с паролем, который вы задали при активации.';
    if (preview.expired) return 'Срок действия ссылки истёк. Попросите куратора отправить приглашение повторно.';
    return 'Ссылка недействительна. Попросите куратора отправить новое приглашение.';
}

const InviteActivatePage: React.FC = () => {
    const inviteToken = useMemo(
        () => new URLSearchParams(window.location.search).get('token')?.trim() ?? '',
        [],
    );

    const [phase, setPhase] = useState<PagePhase>('loading');
    const [preview, setPreview] = useState<AgentInvitePreviewResponse | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!inviteToken) {
            setPageError('В ссылке нет токена приглашения. Откройте страницу из письма целиком.');
            setPhase('invalid');
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await authApi.getAgentInvitePreview(inviteToken);
                if (cancelled) return;
                setPreview(data);
                if (!data.valid) {
                    setPageError(invalidLinkMessage(data));
                    setPhase('invalid');
                } else {
                    setPhase('form');
                }
            } catch {
                if (cancelled) return;
                setPageError('Не удалось проверить ссылку. Попробуйте позже или запросите новое приглашение.');
                setPhase('invalid');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [inviteToken]);

    const redirectToLk = () => {
        const url = new URL(window.location.origin);
        url.pathname = '/';
        url.search = '';
        window.location.replace(url.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (password.length < 6) {
            setFormError('Пароль не короче 6 символов');
            return;
        }
        if (password !== passwordRepeat) {
            setFormError('Пароли не совпадают');
            return;
        }

        setPhase('submitting');
        try {
            const res = await authApi.activateAgentInvite(inviteToken, password);
            localStorage.setItem('token', res.token);
            if (res.user) {
                localStorage.setItem('user', JSON.stringify(res.user));
            }
            redirectToLk();
        } catch (err) {
            setFormError(getActivateInviteErrorMessage(err));
            setPhase('form');
        }
    };

    return (
        <motion.div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
                background: '#0f172a',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card"
                style={{ width: '100%', maxWidth: '440px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div
                        style={{
                            background: 'var(--primary)',
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            boxShadow: '0 0 20px rgba(255, 199, 80, 0.3)',
                        }}
                    >
                        <KeyRound size={32} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                        Активация Family Office
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        Задайте пароль для входа в личный кабинет агента
                    </p>
                </div>

                {phase === 'loading' && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Проверяем ссылку…</p>
                )}

                {phase === 'invalid' && (
                    <motion.div
                        style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#fca5a5',
                            fontSize: '14px',
                        }}
                    >
                        {pageError}
                    </motion.div>
                )}

                {(phase === 'form' || phase === 'submitting') && preview && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                marginBottom: '20px',
                            }}
                        >
                            <User size={20} color="var(--primary)" />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                    {formatInviteeName(preview)}
                                </div>
                                {preview.email && (
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {preview.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {formError && (
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#fca5a5',
                                        fontSize: '14px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="input-group">
                                <label className="label">Пароль</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock
                                        size={18}
                                        style={{
                                            position: 'absolute',
                                            left: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)',
                                        }}
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="Не менее 6 символов"
                                        minLength={6}
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="label">Повторите пароль</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock
                                        size={18}
                                        style={{
                                            position: 'absolute',
                                            left: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)',
                                        }}
                                    />
                                    <input
                                        type="password"
                                        value={passwordRepeat}
                                        onChange={(e) => setPasswordRepeat(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="Ещё раз"
                                        minLength={6}
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ marginTop: '8px' }}
                                disabled={phase === 'submitting'}
                            >
                                {phase === 'submitting' ? 'Активация…' : 'Активировать и войти'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default InviteActivatePage;
