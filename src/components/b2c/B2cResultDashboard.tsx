import React, { useEffect, useMemo, useState } from 'react';
import {
    Bell,
    Calendar,
    ChevronDown,
    FileText,
    MessageCircle,
    TreePalm,
    RefreshCw,
    Send,
    Settings2,
    Shield,
    Target,
    User,
} from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import {
    formatRub,
    formatRubCompact,
    mapB2cResultDashboard,
} from '../../utils/b2cResultDashboard';

const NAV_TABS = [
    'Личные данные',
    'Семья',
    'Цели',
    'Активы',
    'Финплан',
    'Риски',
    'Отчёты',
] as const;

const QUICK_ACTIONS = [
    { id: 'restart', label: 'Изменить анкету', icon: RefreshCw, enabled: true },
    { id: 'goals', label: 'Изменить цели', icon: Target, enabled: false },
    { id: 'meet', label: 'Записаться на встречу', icon: Calendar, enabled: false },
    { id: 'ask', label: 'Задать вопрос', icon: MessageCircle, enabled: false },
] as const;

function buildDonutGradient(
    items: Array<{ amount: number; share: number; color: string }>,
    total: number,
): string {
    if (!items.length) return 'rgba(255,255,255,0.08)';
    let angle = 0;
    const parts = items.map((item) => {
        const pct = total > 0 ? (item.amount / total) * 100 : item.share;
        const next = angle + Math.max(0, pct) * 3.6;
        const seg = `${item.color} ${angle}deg ${next}deg`;
        angle = next;
        return seg;
    });
    return `conic-gradient(${parts.join(', ')})`;
}

interface B2cResultDashboardProps {
    data: unknown;
    inviterName?: string;
    isPlanSaved?: boolean;
    onSavePlan?: () => void;
    onOpenHtmlReport?: () => void | Promise<void>;
    onOpenPdfReport?: () => void | Promise<void>;
    onRestart?: () => void;
    restartLabel?: string;
}

const B2cResultDashboard: React.FC<B2cResultDashboardProps> = ({
    data,
    inviterName,
    isPlanSaved,
    onSavePlan,
    onOpenHtmlReport,
    onOpenPdfReport,
    onRestart,
    restartLabel = 'Изменить анкету',
}) => {
    const model = useMemo(() => mapB2cResultDashboard(data), [data]);
    const [visibleText, setVisibleText] = useState('');
    const [streamDone, setStreamDone] = useState(false);

    useEffect(() => {
        setVisibleText('');
        setStreamDone(false);
        let index = 0;
        const message = model.coachMessage;
        const interval = window.setInterval(() => {
            index += 1;
            setVisibleText(message.slice(0, index));
            if (index >= message.length) {
                setStreamDone(true);
                window.clearInterval(interval);
            }
        }, 12);
        return () => window.clearInterval(interval);
    }, [model.coachMessage]);

    const donutGradient = useMemo(
        () => buildDonutGradient(model.allocations, model.portfolioTotal),
        [model.allocations, model.portfolioTotal],
    );

    const topUpGradient = useMemo(
        () => buildDonutGradient(model.topUpAllocations, model.topUpTotal),
        [model.topUpAllocations, model.topUpTotal],
    );

    // Полукруг: 0% слева (−90°), 100% справа (+90°), ось — низ центра
    const gaugeRotation = -90 + (model.riskGaugePercent / 100) * 180;

    return (
        <div className="b2c-result-dash">
            <header className="b2c-result-dash__topnav">
                <div className="b2c-result-dash__brand">
                    <img
                        src={b2cVisualAssets.familyOfficeLogo}
                        alt=""
                        width={36}
                        height={36}
                        className="b2c-result-dash__brand-logo"
                    />
                    <span className="b2c-result-dash__brand-title">FAMILY OFFICE</span>
                </div>

                <nav className="b2c-result-dash__tabs" aria-label="Разделы кабинета">
                    {NAV_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`b2c-result-dash__tab${tab === 'Финплан' ? ' b2c-result-dash__tab--active' : ''}`}
                            disabled={tab !== 'Финплан'}
                            title={tab !== 'Финплан' ? 'Скоро' : undefined}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="b2c-result-dash__top-end">
                    <button type="button" className="b2c-result-dash__icon-btn" disabled title="Скоро">
                        <Bell size={18} />
                    </button>
                    <button type="button" className="b2c-result-dash__profile" disabled title="Скоро">
                        <span className="b2c-result-dash__profile-avatar" aria-hidden>
                            <User size={16} />
                        </span>
                        <span className="b2c-result-dash__profile-name">
                            {inviterName ? `Клиент · ${inviterName}` : 'Гость Family Office'}
                        </span>
                        <ChevronDown size={14} />
                    </button>
                </div>
            </header>

            <div className="b2c-result-dash__workspace">
                <aside className="b2c-result-dash__sidebar" aria-label="AI-консультант">
                    <div className="b2c-result-dash__coach-profile">
                        <img
                            src={b2cVisualAssets.victoriaAvatar}
                            alt="Виктория"
                            className="b2c-result-dash__coach-avatar"
                        />
                        <div className="b2c-result-dash__coach-meta">
                            <div className="b2c-result-dash__coach-name">Виктория</div>
                            <div className="b2c-result-dash__coach-role">Ваш финансовый консультант</div>
                        </div>
                        <span className="b2c-result-dash__online">Online</span>
                    </div>

                    <div className="b2c-result-dash__bubble" aria-live="polite">
                        <p>
                            {visibleText}
                            {!streamDone ? <span className="b2c-result-dash__caret" aria-hidden /> : null}
                        </p>
                    </div>

                    <div className="b2c-result-dash__actions">
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;
                            const canRun = action.enabled && Boolean(onRestart);
                            return (
                                <button
                                    key={action.id}
                                    type="button"
                                    className="b2c-result-dash__action"
                                    disabled={!canRun}
                                    onClick={canRun ? onRestart : undefined}
                                    title={!canRun ? 'Скоро' : undefined}
                                >
                                    <Icon size={16} />
                                    <span>{action.id === 'restart' ? restartLabel : action.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="b2c-result-dash__composer">
                        <input
                            type="text"
                            className="b2c-result-dash__composer-input"
                            placeholder="Написать сообщение…"
                            disabled
                        />
                        <button type="button" className="b2c-result-dash__composer-send" disabled aria-label="Отправить">
                            <Send size={16} />
                        </button>
                    </div>

                    <div className="b2c-result-dash__inspire">
                        <div className="b2c-result-dash__inspire-title">Фокус на важном</div>
                        <p className="b2c-result-dash__inspire-text">
                            Семья и цели — в центре плана. Капитал растёт, когда решения спокойные и регулярные.
                        </p>
                    </div>
                </aside>

                <main className="b2c-result-dash__main">
                    <div className="b2c-result-dash__main-head">
                        <div>
                            <h1 className="b2c-result-dash__title">Обзор вашего финансового плана</h1>
                            <p className="b2c-result-dash__subtitle">Сводка по капиталу, целям и риску после расчёта</p>
                        </div>
                        <div className="b2c-result-dash__main-actions">
                            {!isPlanSaved && onSavePlan ? (
                                <button type="button" className="b2c-result-dash__btn b2c-result-dash__btn--primary" onClick={onSavePlan}>
                                    Сохранить план
                                </button>
                            ) : null}
                            {isPlanSaved && onOpenHtmlReport ? (
                                <button
                                    type="button"
                                    className="b2c-result-dash__btn"
                                    onClick={() => void onOpenHtmlReport()}
                                >
                                    <FileText size={15} />
                                    HTML
                                </button>
                            ) : null}
                            {isPlanSaved && onOpenPdfReport ? (
                                <button
                                    type="button"
                                    className="b2c-result-dash__btn b2c-result-dash__btn--primary"
                                    onClick={() => void onOpenPdfReport()}
                                >
                                    <FileText size={15} />
                                    PDF
                                </button>
                            ) : null}
                            <button type="button" className="b2c-result-dash__btn" disabled title="Скоро">
                                <Settings2 size={15} />
                                Настроить
                            </button>
                        </div>
                    </div>

                    <section className="b2c-result-dash__kpi-row" aria-label="Ключевые показатели">
                        <article className="b2c-result-dash__kpi">
                            <div className="b2c-result-dash__kpi-label">Итоговый капитал</div>
                            <div className="b2c-result-dash__kpi-value">{model.totalCapitalLabel}</div>
                            <div className="b2c-result-dash__kpi-caption">по текущему расчёту</div>
                        </article>
                        <article className="b2c-result-dash__kpi">
                            <div className="b2c-result-dash__kpi-label">Доходность портфеля</div>
                            <div className="b2c-result-dash__kpi-value">
                                {model.portfolioYieldPercent > 0
                                    ? `${model.portfolioYieldPercent.toFixed(1)}%`
                                    : '—'}
                            </div>
                            <div className="b2c-result-dash__kpi-caption">прогноз на год</div>
                        </article>
                        <article className="b2c-result-dash__kpi">
                            <div className="b2c-result-dash__kpi-label">Целей в плане</div>
                            <div className="b2c-result-dash__kpi-value">{model.activeGoalsCount}</div>
                            <div className="b2c-result-dash__kpi-caption">активных сценариев</div>
                        </article>
                        <article className="b2c-result-dash__kpi">
                            <div className="b2c-result-dash__kpi-label">Фин. свобода</div>
                            <div className="b2c-result-dash__kpi-value b2c-result-dash__kpi-value--with-icon">
                                <TreePalm size={18} className="b2c-result-dash__kpi-icon" />
                                {model.freedomYear ?? '—'}
                            </div>
                            <div className="b2c-result-dash__kpi-caption">ориентир по срокам целей</div>
                        </article>
                        <article className="b2c-result-dash__kpi">
                            <div className="b2c-result-dash__kpi-label">Риск-профиль</div>
                            <div className="b2c-result-dash__kpi-value b2c-result-dash__kpi-value--sm">
                                <Shield size={16} className="b2c-result-dash__kpi-icon" />
                                {model.riskLabel}
                            </div>
                            <div className="b2c-result-dash__kpi-caption">по анкете</div>
                        </article>
                    </section>

                    <section className="b2c-result-dash__charts" aria-label="Аналитика">
                        <article className="b2c-result-dash__panel">
                            <h2 className="b2c-result-dash__panel-title">Структура портфеля</h2>
                            <div className="b2c-result-dash__donut-wrap">
                                <div
                                    className="b2c-result-dash__donut"
                                    style={{ background: donutGradient }}
                                    aria-hidden
                                >
                                    <div className="b2c-result-dash__donut-hole">
                                        <span className="b2c-result-dash__donut-caption">Всего</span>
                                        <strong>{formatRubCompact(model.portfolioTotal)}</strong>
                                    </div>
                                </div>
                                <ul className="b2c-result-dash__legend">
                                    {model.allocations.map((item) => (
                                        <li key={item.name}>
                                            <span
                                                className="b2c-result-dash__legend-dot"
                                                style={{ background: item.color }}
                                            />
                                            <span className="b2c-result-dash__legend-name">{item.name}</span>
                                            <span className="b2c-result-dash__legend-pct">
                                                {item.share.toFixed(0)}%
                                            </span>
                                            <span className="b2c-result-dash__legend-amt">
                                                {formatRubCompact(item.amount)}
                                            </span>
                                        </li>
                                    ))}
                                    {!model.allocations.length ? (
                                        <li className="b2c-result-dash__legend-empty">Нет данных по структуре</li>
                                    ) : null}
                                </ul>
                            </div>
                        </article>

                        <article className="b2c-result-dash__panel">
                            <h2 className="b2c-result-dash__panel-title">Портфель пополнения</h2>
                            <div className="b2c-result-dash__donut-wrap">
                                <div
                                    className="b2c-result-dash__donut"
                                    style={{ background: topUpGradient }}
                                    aria-hidden
                                >
                                    <div className="b2c-result-dash__donut-hole">
                                        <span className="b2c-result-dash__donut-caption">В месяц</span>
                                        <strong>
                                            {model.topUpTotal > 0
                                                ? formatRubCompact(model.topUpTotal)
                                                : model.monthlyTopUp > 0
                                                  ? formatRubCompact(model.monthlyTopUp)
                                                  : '—'}
                                        </strong>
                                    </div>
                                </div>
                                <ul className="b2c-result-dash__legend">
                                    {model.topUpAllocations.map((item) => (
                                        <li key={`topup-${item.name}`}>
                                            <span
                                                className="b2c-result-dash__legend-dot"
                                                style={{ background: item.color }}
                                            />
                                            <span className="b2c-result-dash__legend-name">{item.name}</span>
                                            <span className="b2c-result-dash__legend-pct">
                                                {item.share.toFixed(0)}%
                                            </span>
                                            <span className="b2c-result-dash__legend-amt">
                                                {formatRubCompact(item.amount)}
                                            </span>
                                        </li>
                                    ))}
                                    {!model.topUpAllocations.length ? (
                                        <li className="b2c-result-dash__legend-empty">
                                            {model.monthlyTopUp > 0
                                                ? `Суммарно ${formatRubCompact(model.monthlyTopUp)} / мес`
                                                : 'Нет данных по пополнению'}
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        </article>

                        <article className="b2c-result-dash__panel">
                            <h2 className="b2c-result-dash__panel-title">Риск-профиль</h2>
                            <div className="b2c-result-dash__gauge-wrap">
                                <div className="b2c-result-dash__gauge" aria-hidden>
                                    <div className="b2c-result-dash__gauge-arc" />
                                    <div className="b2c-result-dash__gauge-pivot">
                                        <div
                                            className="b2c-result-dash__gauge-needle"
                                            style={{ transform: `rotate(${gaugeRotation}deg)` }}
                                        />
                                        <div className="b2c-result-dash__gauge-center" />
                                    </div>
                                </div>
                                <div className="b2c-result-dash__gauge-label">{model.riskLabel}</div>
                                <p className="b2c-result-dash__gauge-hint">
                                    {model.riskScore != null
                                        ? `Оценка: ${Number(model.riskScore).toFixed(
                                              Number.isInteger(model.riskScore) ? 0 : 3,
                                          )}`
                                        : 'По результатам анкеты риск-профиля'}
                                </p>
                            </div>
                        </article>
                    </section>

                    <section className="b2c-result-dash__goals" aria-label="Ключевые цели">
                        <h2 className="b2c-result-dash__section-title">Ключевые цели</h2>
                        <div className="b2c-result-dash__goals-grid">
                            {model.keyGoals.map((goal) => (
                                <article key={`${goal.id}-${goal.name}`} className="b2c-result-dash__goal-card">
                                    <div
                                        className="b2c-result-dash__goal-bg"
                                        style={{ backgroundImage: `url(${goal.image})` }}
                                    />
                                    <div className="b2c-result-dash__goal-body">
                                        <h3>{goal.name}</h3>
                                        <div className="b2c-result-dash__goal-meta">
                                            {goal.slots.map((slot) => (
                                                <div key={`${goal.id}-${slot.label}`}>
                                                    <span>{slot.label}</span>
                                                    <strong>{slot.value}</strong>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="b2c-result-dash__goal-progress">
                                            <div className="b2c-result-dash__bar-track">
                                                <div
                                                    className="b2c-result-dash__bar-fill"
                                                    style={{ width: `${goal.progressPercent}%` }}
                                                />
                                            </div>
                                            <span>{goal.progressPercent}%</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="b2c-result-dash__footer-stats" aria-label="Дополнительно">
                        <div className="b2c-result-dash__stat">
                            <span>Защита семьи</span>
                            <strong>{model.lifeCoverage > 0 ? formatRubCompact(model.lifeCoverage) : '—'}</strong>
                        </div>
                        <div className="b2c-result-dash__stat">
                            <span>Финрезерв</span>
                            <strong>{model.finReserve > 0 ? formatRubCompact(model.finReserve) : '—'}</strong>
                        </div>
                        <div className="b2c-result-dash__stat">
                            <span>Ежем. пополнение</span>
                            <strong>{model.monthlyTopUp > 0 ? formatRub(model.monthlyTopUp) : '—'}</strong>
                        </div>
                        <div className="b2c-result-dash__stat b2c-result-dash__stat--accent">
                            <Calendar size={16} />
                            <div>
                                <span>Следующая встреча</span>
                                <strong>{model.nextMeetingLabel}</strong>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default B2cResultDashboard;
