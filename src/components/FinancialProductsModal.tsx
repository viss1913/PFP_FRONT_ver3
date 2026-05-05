import React, { useCallback, useEffect, useState } from 'react';
import {
    agentLkApi,
    BrokerAccountEmailError,
    type BrokerAccountEmailResponse,
    LifeInsuranceEmailError,
    type LifeInsuranceEmailResponse,
} from '../api/agentLkApi';

interface FinancialProductsModalProps {
    isOpen: boolean;
    clientId: number | string | null;
    clientEmail?: string | null;
    onClose: () => void;
}

type LifeInsuranceState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; email: string; offerUrl: string }
    | { kind: 'error'; message: string };

type BrokerAccountState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; email: string; openUrl: string }
    | { kind: 'error'; message: string };

const SBER_GREEN = '#21A038';
const SBER_GREEN_DARK = '#1B8A2D';

const FinancialProductsModal: React.FC<FinancialProductsModalProps> = ({
    isOpen,
    clientId,
    clientEmail,
    onClose,
}) => {
    const [lifeState, setLifeState] = useState<LifeInsuranceState>({ kind: 'idle' });
    const [brokerState, setBrokerState] = useState<BrokerAccountState>({ kind: 'idle' });
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setLifeState({ kind: 'idle' });
            setBrokerState({ kind: 'idle' });
            setToast(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const handleSendLifeInsurance = useCallback(async () => {
        if (clientId == null || (typeof clientId === 'string' && !clientId.trim())) {
            setLifeState({
                kind: 'error',
                message: 'Не удалось определить ID клиента. Обнови страницу и попробуй снова.',
            });
            return;
        }

        setLifeState({ kind: 'loading' });
        try {
            const res: LifeInsuranceEmailResponse = await agentLkApi.sendLifeInsuranceEmail(clientId);
            if (!res?.ok) {
                setLifeState({
                    kind: 'error',
                    message: 'Сервер вернул ok=false. Попробуйте ещё раз чуть позже.',
                });
                return;
            }
            const email = res.client_email || clientEmail || 'email клиента';
            const offerUrl = res.offer_url || 'https://sberbank-insurance.ru/podushka-bezopasnosti';
            setLifeState({ kind: 'success', email, offerUrl });
            setToast(`Письмо отправили на ${email}`);
            window.open(offerUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            const message =
                error instanceof LifeInsuranceEmailError
                    ? error.message
                    : 'Не удалось отправить письмо. Попробуйте позже.';
            setLifeState({ kind: 'error', message });
        }
    }, [clientId, clientEmail]);

    const handleSendBrokerAccount = useCallback(async () => {
        if (clientId == null || (typeof clientId === 'string' && !clientId.trim())) {
            setBrokerState({
                kind: 'error',
                message: 'Не удалось определить ID клиента. Обнови страницу и попробуй снова.',
            });
            return;
        }

        setBrokerState({ kind: 'loading' });
        try {
            const res: BrokerAccountEmailResponse = await agentLkApi.sendBrokerAccountEmail(clientId);
            if (!res?.ok) {
                setBrokerState({
                    kind: 'error',
                    message: 'Сервер вернул ok=false. Попробуйте ещё раз чуть позже.',
                });
                return;
            }
            const email = res.client_email || clientEmail || 'email клиента';
            const openUrl = res.open_url || 'https://www.finam.ru/open/order/russia/';
            setBrokerState({ kind: 'success', email, openUrl });
            setToast(`Письмо отправили на ${email}`);
            window.open(openUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            const message =
                error instanceof BrokerAccountEmailError
                    ? error.message
                    : 'Не удалось отправить письмо. Попробуйте позже.';
            setBrokerState({ kind: 'error', message });
        }
    }, [clientId, clientEmail]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1300,
                padding: '16px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: 'min(720px, 100%)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        padding: '24px 28px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '20px', color: '#0f172a' }}>
                            Финансовые продукты Сбера
                        </span>
                        <span style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.4 }}>
                            Подберём клиенту персональное предложение и отправим на email
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '24px',
                            lineHeight: 1,
                            color: '#94a3b8',
                            padding: '4px 8px',
                        }}
                    >
                        ×
                    </button>
                </div>

                <div
                    style={{
                        padding: '20px 28px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <ProductCard
                        icon="🏦"
                        iconBg="linear-gradient(135deg, #1f6feb 0%, #1d4ed8 100%)"
                        title="Открыть банковский счёт"
                        description="Брокерский счёт Финам с быстрым онлайн-открытием"
                        accent
                        right={
                            <BrokerAccountCta
                                state={brokerState}
                                onSend={() => void handleSendBrokerAccount()}
                                onReopen={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                            />
                        }
                        bottomSlot={
                            brokerState.kind === 'error' ? (
                                <ErrorBanner message={brokerState.message} onRetry={() => void handleSendBrokerAccount()} />
                            ) : brokerState.kind === 'success' ? (
                                <SuccessBanner email={brokerState.email} />
                            ) : null
                        }
                    />

                    <ProductCard
                        icon="🛡️"
                        iconBg={`linear-gradient(135deg, ${SBER_GREEN} 0%, ${SBER_GREEN_DARK} 100%)`}
                        title="Защитить жизнь"
                        description="Подушка безопасности от Сбербанк Страхование"
                        accent
                        right={
                            <LifeInsuranceCta
                                state={lifeState}
                                onSend={() => void handleSendLifeInsurance()}
                                onReopen={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                            />
                        }
                        bottomSlot={
                            lifeState.kind === 'error' ? (
                                <ErrorBanner message={lifeState.message} onRetry={() => void handleSendLifeInsurance()} />
                            ) : lifeState.kind === 'success' ? (
                                <SuccessBanner email={lifeState.email} />
                            ) : null
                        }
                    />

                    <ProductCard
                        icon="📈"
                        iconBg="linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                        title="Инвестировать"
                        description="Брокерский счёт и готовые портфели"
                        right={<ComingSoonBadge />}
                        disabled
                    />
                </div>

                {toast && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '20px',
                            background: '#0f172a',
                            color: '#fff',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            boxShadow: '0 12px 32px rgba(15,23,42,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            maxWidth: 'calc(100% - 40px)',
                            animation: 'fpmToastIn 0.25s ease-out',
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>✉️</span>
                        <span>{toast}</span>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fpmToastIn {
                    from { transform: translateY(8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fpmSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

interface ProductCardProps {
    icon: string;
    iconBg: string;
    title: string;
    description: string;
    right: React.ReactNode;
    accent?: boolean;
    disabled?: boolean;
    bottomSlot?: React.ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({
    icon,
    iconBg,
    title,
    description,
    right,
    accent,
    disabled,
    bottomSlot,
}) => {
    return (
        <div
            style={{
                border: accent ? `2px solid ${SBER_GREEN}` : '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '20px',
                background: accent
                    ? 'linear-gradient(135deg, rgba(33,160,56,0.06) 0%, rgba(33,160,56,0.02) 100%)'
                    : '#fff',
                opacity: disabled ? 0.7 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'box-shadow 0.15s ease',
                boxShadow: accent ? '0 8px 24px rgba(33,160,56,0.12)' : 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '17px', color: '#0f172a' }}>{title}</span>
                    <span style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.4 }}>{description}</span>
                </div>
                <div style={{ flexShrink: 0 }}>{right}</div>
            </div>
            {bottomSlot}
        </div>
    );
};

const ComingSoonBadge: React.FC = () => (
    <span
        style={{
            display: 'inline-block',
            padding: '6px 12px',
            background: '#f1f5f9',
            color: '#64748b',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
        }}
    >
        Скоро
    </span>
);

interface BrokerAccountCtaProps {
    state: BrokerAccountState;
    onSend: () => void;
    onReopen: (url: string) => void;
}

const BrokerAccountCta: React.FC<BrokerAccountCtaProps> = ({ state, onSend, onReopen }) => {
    if (state.kind === 'loading') {
        return (
            <button
                type="button"
                disabled
                style={{
                    background: '#1d4ed8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'wait',
                    opacity: 0.85,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: '160px',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'fpmSpin 0.8s linear infinite',
                    }}
                />
                Отправляем…
            </button>
        );
    }

    if (state.kind === 'success') {
        return (
            <button
                type="button"
                onClick={() => onReopen(state.openUrl)}
                style={{
                    background: '#fff',
                    color: '#1d4ed8',
                    border: '1.5px solid #1d4ed8',
                    borderRadius: '999px',
                    padding: '11px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '160px',
                }}
            >
                Открыть счёт
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onSend}
            style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                minWidth: '160px',
                transition: 'transform 0.1s',
            }}
        >
            Открыть счёт
        </button>
    );
};

interface LifeInsuranceCtaProps {
    state: LifeInsuranceState;
    onSend: () => void;
    onReopen: (url: string) => void;
}

const LifeInsuranceCta: React.FC<LifeInsuranceCtaProps> = ({ state, onSend, onReopen }) => {
    if (state.kind === 'loading') {
        return (
            <button
                type="button"
                disabled
                style={{
                    background: SBER_GREEN,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'wait',
                    opacity: 0.85,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: '160px',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'fpmSpin 0.8s linear infinite',
                    }}
                />
                Отправляем…
            </button>
        );
    }

    if (state.kind === 'success') {
        return (
            <button
                type="button"
                onClick={() => onReopen(state.offerUrl)}
                style={{
                    background: '#fff',
                    color: SBER_GREEN_DARK,
                    border: `1.5px solid ${SBER_GREEN}`,
                    borderRadius: '999px',
                    padding: '11px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '160px',
                }}
            >
                Открыть предложение
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onSend}
            style={{
                background: `linear-gradient(135deg, ${SBER_GREEN} 0%, ${SBER_GREEN_DARK} 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(33,160,56,0.35)',
                minWidth: '160px',
                transition: 'transform 0.1s',
            }}
        >
            Оформить
        </button>
    );
};

const SuccessBanner: React.FC<{ email: string }> = ({ email }) => (
    <div
        style={{
            background: 'rgba(33,160,56,0.08)',
            border: `1px solid rgba(33,160,56,0.25)`,
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: SBER_GREEN_DARK,
            fontSize: '13px',
            fontWeight: 500,
        }}
    >
        <span style={{ fontSize: '16px' }}>✅</span>
        <span>
            Письмо отправлено на <b>{email}</b>
        </span>
    </div>
);

const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div
        style={{
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991b1b',
            fontSize: '13px',
            flexWrap: 'wrap',
        }}
    >
        <span style={{ fontSize: '16px' }}>⚠️</span>
        <span style={{ flex: 1, minWidth: 0 }}>{message}</span>
        <button
            type="button"
            onClick={onRetry}
            style={{
                background: '#fff',
                color: '#991b1b',
                border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
            }}
        >
            Повторить
        </button>
    </div>
);

export default FinancialProductsModal;
