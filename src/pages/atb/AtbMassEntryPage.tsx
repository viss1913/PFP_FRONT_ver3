import React, { useCallback, useEffect, useState } from 'react';
import LoginPage from '../../components/LoginPage';
import LkFinamGate from '../../components/LkFinamGate';
import Header from '../../components/Header';
import AtbMassFlow from '../../components/atb/AtbMassFlow';
import ResultPage from '../../components/ResultPage';
import AiCrmPage from '../../components/AiCrmPage';
import SettingsPage from '../../pages/SettingsPage';
import { useAgentProfile } from '../../context/AgentProfileContext';
import { clientApi } from '../../api/clientApi';
import type { Client } from '../../types/client';
import { ATB_LK_NAV_ITEMS } from '../../components/lk/atbLkNavigation';
import type { NavPage } from '../../components/lk/lkNavigation';
import { isAtbBankPath } from '../../config/atbMass';

type LoginView = 'login';
type ProtectedSection = 'crm' | 'pfp' | 'settings';
type PfpView = 'flow' | 'result';

function resolveClientId(result: unknown): number | null {
    const r = result as Record<string, unknown> | null | undefined;
    const raw = r?.client_id || r?.id || (r?.summary as Record<string, unknown> | undefined)?.client_id
        || (r?.client as Record<string, unknown> | undefined)?.id;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function getLaneTitle(): string {
    return isAtbBankPath() ? 'ATB Bank' : 'ATB mass';
}

const AtbMassEntryPage: React.FC = () => {
    const { refreshProfile } = useAgentProfile();
    const [loginView, setLoginView] = useState<LoginView | null>(
        () => (localStorage.getItem('token') ? null : 'login'),
    );
    const [bootLoading, setBootLoading] = useState<boolean>(Boolean(localStorage.getItem('token')));
    const [section, setSection] = useState<ProtectedSection>('crm');
    const [pfpView, setPfpView] = useState<PfpView>('flow');
    const [calculationResult, setCalculationResult] = useState<unknown>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [resultLoading, setResultLoading] = useState(false);
    const [clientLoading, setClientLoading] = useState(false);

    const laneTitle = getLaneTitle();

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setBootLoading(false);
                setLoginView('login');
                return;
            }

            setBootLoading(true);
            try {
                const me = await refreshProfile();
                if (cancelled) return;
                if (!me || me.role === 'client') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setLoginView('login');
                    return;
                }
                setLoginView(null);
            } catch (error) {
                console.error('ATB lane boot failed:', error);
                if (!cancelled) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setLoginView('login');
                }
            } finally {
                if (!cancelled) {
                    setBootLoading(false);
                }
            }
        };

        void boot();
        return () => {
            cancelled = true;
        };
    }, [refreshProfile]);

    const handleLoginSuccess = useCallback(async () => {
        setBootLoading(true);
        try {
            const me = await refreshProfile();
            if (!me || me.role === 'client') {
                alert('Этот вход доступен только агенту.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setLoginView('login');
                return;
            }
            setLoginView(null);
            setSection('crm');
        } finally {
            setBootLoading(false);
        }
    }, [refreshProfile]);

    const handleNavigate = useCallback((page: NavPage) => {
        if (page === 'crm') {
            setSection('crm');
            return;
        }
        if (page === 'settings') {
            setSection('settings');
            return;
        }
        if (page === 'pfp') {
            setSection('pfp');
            return;
        }
        // Остальные пункты полного ЛК в ATB lane не показываем
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('uuid');
        setCalculationResult(null);
        setSelectedClient(null);
        setPfpView('flow');
        setSection('crm');
        setLoginView('login');
    }, []);

    const handleFlowComplete = useCallback(async (result: unknown) => {
        setResultLoading(true);
        try {
            const clientId = resolveClientId(result);
            if (clientId) {
                try {
                    const fullClient = await clientApi.getClient(clientId);
                    if (!fullClient.id) {
                        fullClient.id = clientId;
                    }
                    setSelectedClient(fullClient);
                } catch (error) {
                    console.error('ATB lane: failed to fetch full client after first-run:', error);
                    setSelectedClient({ id: clientId } as Client);
                }
            } else {
                setSelectedClient(null);
            }

            setCalculationResult(result);
            setPfpView('result');
            setSection('pfp');
        } finally {
            setResultLoading(false);
        }
    }, []);

    const handleRestartPfp = useCallback(() => {
        setCalculationResult(null);
        setSelectedClient(null);
        setPfpView('flow');
    }, []);

    const handleNewClient = useCallback(() => {
        setSelectedClient(null);
        setCalculationResult(null);
        setPfpView('flow');
        setSection('pfp');
    }, []);

    const handleSelectClient = useCallback(async (client: Client) => {
        setClientLoading(true);
        try {
            const fullClient = await clientApi.getClient(client.id);
            if (!fullClient.id) {
                fullClient.id = client.id;
            }
            setSelectedClient(fullClient);

            if (fullClient.goals_summary) {
                setCalculationResult(fullClient.goals_summary);
                setPfpView('result');
                setSection('pfp');
            } else {
                setCalculationResult(null);
                setPfpView('flow');
                setSection('pfp');
            }
        } catch (error) {
            console.error('ATB lane: failed to load client:', error);
            setSelectedClient(client);
            setPfpView('flow');
            setSection('pfp');
        } finally {
            setClientLoading(false);
        }
    }, []);

    const activeNavPage: NavPage = section;

    if (bootLoading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
                    color: '#334155',
                    fontWeight: 600,
                }}
            >
                Загружаем {laneTitle}…
            </div>
        );
    }

    if (loginView === 'login') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
                <div style={{ padding: '32px 20px' }}>
                    <div style={{ maxWidth: 960, margin: '0 auto 24px' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 14px',
                                borderRadius: 999,
                                background: 'rgba(15, 23, 42, 0.06)',
                                color: '#0f172a',
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            {laneTitle}
                        </div>
                        <h1 style={{ margin: '18px 0 10px', fontSize: 38, lineHeight: 1.05, color: '#0f172a' }}>
                            Вход агента
                        </h1>
                        <p style={{ margin: 0, maxWidth: 640, color: '#475569', lineHeight: 1.65 }}>
                            Упрощённый ПФП, AI CRM и настройки в контексте ATB. После входа — боковое меню слева.
                        </p>
                    </div>
                    <LoginPage onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <LkFinamGate enabled>
            <Header
                activePage={activeNavPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                navItems={ATB_LK_NAV_ITEMS}
            >
                {clientLoading && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1100,
                            color: '#fff',
                            fontWeight: 600,
                        }}
                    >
                        Загрузка клиента…
                    </div>
                )}

                {section === 'crm' && (
                    <AiCrmPage
                        contentOnly
                        onSelectClient={handleSelectClient}
                        onNewClient={handleNewClient}
                        onNavigate={handleNavigate}
                    />
                )}

                {section === 'settings' && (
                    <SettingsPage contentOnly onNavigate={handleNavigate} />
                )}

                {section === 'pfp' && (
                    pfpView === 'flow' ? (
                        <AtbMassFlow onComplete={handleFlowComplete} />
                    ) : (
                        <div style={{ minHeight: 'calc(100vh - var(--lk-header-h))' }}>
                            {resultLoading ? (
                                <div
                                    style={{
                                        minHeight: 320,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#334155',
                                        fontWeight: 600,
                                    }}
                                >
                                    Подгружаем результат…
                                </div>
                            ) : (
                                <ResultPage
                                    data={calculationResult}
                                    client={selectedClient}
                                    onRestart={handleRestartPfp}
                                    restartLabel="Новый расчёт ATB"
                                />
                            )}
                        </div>
                    )
                )}
            </Header>
        </LkFinamGate>
    );
};

export default AtbMassEntryPage;
