import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import CJMFlow, { type CJMCompleteContext } from '../../components/CJMFlow';
import B2cClientWelcome from '../../components/b2c/B2cClientWelcome';
import { b2cVisualAssets } from '../../content/b2cAssets';
import B2cClientPlanSaveModal from '../../components/b2c/B2cClientPlanSaveModal';
import B2cResultDashboard from '../../components/b2c/B2cResultDashboard';
import ResultPage from '../../components/ResultPage';
import { b2cApi, parseGuestCalculateLead, type ClientReferralPreviewResponse } from '../../api/b2cApi';
import { captureClientB2cAttributionFromUrl } from '../../utils/clientB2cAttribution';
import {
    isGuestPlanSaved,
    setGuestPlanSession,
    getClientB2cToken,
} from '../../utils/clientB2cAuth';
import { saveB2cPlanDraft, loadB2cPlanDraft } from '../../utils/b2cPlanDraft';
import { wrapReportHtmlForMobile } from '../../utils/reportHtmlSrcdoc';
import { isB2cPlanOrchestratorEnabled } from '../../utils/b2cPlanOrchestratorFlag';
import B2cPlanOrchestratorFlow from '../../components/b2c/B2cPlanOrchestratorFlow';
import '../../styles/b2c-guest-plan.css';

type GuestView = 'welcome' | 'cjm' | 'result';

const DESKTOP_RESULT_MQ = '(min-width: 1024px)';

function useDesktopResultLayout(): boolean {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(DESKTOP_RESULT_MQ).matches : true,
    );

    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_RESULT_MQ);
        const onChange = () => setIsDesktop(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isDesktop;
}

function restoreGuestSessionFromDraft(): boolean {
    if (getClientB2cToken()) return isGuestPlanSaved();
    const draft = loadB2cPlanDraft();
    if (!draft?.guestToken || !draft.clientId) return false;
    setGuestPlanSession({
        guest_token: draft.guestToken,
        client_id: draft.clientId,
        email: draft.email,
    });
    return true;
}

const B2cGuestPlanPage: React.FC = () => {
    const attribution = useMemo(() => captureClientB2cAttributionFromUrl(), []);
    const orchestratorEnabled = useMemo(() => isB2cPlanOrchestratorEnabled(), []);
    const isDesktopResult = useDesktopResultLayout();
    const [view, setView] = useState<GuestView>('welcome');
    const [calculationResult, setCalculationResult] = useState<unknown>(() => loadB2cPlanDraft()?.calculationResult ?? null);
    const [referralPreview, setReferralPreview] = useState<ClientReferralPreviewResponse | null>(null);
    const [referralError, setReferralError] = useState<string | null>(null);
    const [saveNotice, setSaveNotice] = useState<string | null>(null);
    const [planSaveOpen, setPlanSaveOpen] = useState(false);
    const [isPlanSaved, setIsPlanSaved] = useState(() => restoreGuestSessionFromDraft());
    const showDesktopResult = view === 'result' && isDesktopResult;
    const showOrchestrator =
        orchestratorEnabled && (view === 'welcome' || view === 'cjm' || (view === 'result' && !showDesktopResult));

    useEffect(() => {
        const ref = attribution.ref?.trim();
        if (!ref) return;

        let cancelled = false;
        void (async () => {
            try {
                const preview = await b2cApi.getClientReferralPreview(ref, attribution.project_key);
                if (!cancelled) {
                    setReferralPreview(preview);
                    setReferralError(null);
                }
            } catch {
                if (!cancelled) {
                    setReferralPreview(null);
                    setReferralError('Ссылка приглашения недействительна или устарела.');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [attribution.project_key, attribution.ref]);

    const handleCjmComplete = useCallback((result: unknown, context?: CJMCompleteContext) => {
        setCalculationResult(result);

        const emailFromPayload =
            typeof context?.firstRunPayload?.client?.email === 'string'
                ? context.firstRunPayload.client.email
                : undefined;
        const guestLead = context?.guestLead ?? parseGuestCalculateLead(result, emailFromPayload);
        if (guestLead) {
            setGuestPlanSession({
                guest_token: guestLead.guest_token,
                client_id: guestLead.client_id,
                email: guestLead.email,
            });
            setIsPlanSaved(true);
        }

        if (context?.firstRunPayload) {
            saveB2cPlanDraft({
                firstRunPayload: context.firstRunPayload,
                calculationResult: result,
                savedAt: new Date().toISOString(),
                email: guestLead?.email ?? emailFromPayload,
                guestToken: guestLead?.guest_token,
                clientId: guestLead?.client_id,
                planSaved: guestLead?.plan_saved,
            });
        }
        setView('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handlePlanSaveSuccess = useCallback(
        (planResult: unknown) => {
            const draft = loadB2cPlanDraft();
            const lead = parseGuestCalculateLead(planResult, draft?.email);
            if (lead) {
                setGuestPlanSession({
                    guest_token: lead.guest_token,
                    client_id: lead.client_id,
                    email: lead.email,
                });
            }
            setIsPlanSaved(true);
            setCalculationResult(planResult);
            setSaveNotice(
                lead?.plan_saved
                    ? 'План сохранён. Можно открыть HTML или PDF-отчёт.'
                    : 'План рассчитан. Проверьте email и ссылку приглашения.',
            );
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [],
    );

    const handleSavePlan = useCallback(() => {
        const existing = loadB2cPlanDraft();
        if (!existing?.firstRunPayload) {
            setSaveNotice('Нет данных плана для сохранения. Пройдите анкету заново.');
            return;
        }
        saveB2cPlanDraft({
            ...existing,
            calculationResult,
            savedAt: new Date().toISOString(),
        });
        setSaveNotice(null);
        setPlanSaveOpen(true);
    }, [calculationResult]);

    const handleOpenClientHtmlReport = useCallback(async () => {
        try {
            const html = await b2cApi.getMyPlanReportHtml(attribution.project_key);
            const srcdoc = wrapReportHtmlForMobile(html);
            const blob = new Blob([srcdoc], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank', 'noopener,noreferrer');
            if (!w) {
                URL.revokeObjectURL(url);
                window.alert('Браузер заблокировал новую вкладку. Разрешите всплывающие окна.');
                return;
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Не удалось открыть HTML-отчёт';
            window.alert(msg);
        }
    }, [attribution.project_key]);

    const handleOpenClientPdfReport = useCallback(async () => {
        try {
            const url = await b2cApi.getMyPlanReportPdfUrl(attribution.project_key);
            const w = window.open(url, '_blank', 'noopener,noreferrer');
            if (!w) {
                window.alert('Браузер заблокировал новую вкладку. Разрешите всплывающие окна.');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Не удалось открыть PDF-отчёт';
            window.alert(msg);
        }
    }, [attribution.project_key]);

    const handleOpenClientReport = useCallback(() => {
        void handleOpenClientHtmlReport();
    }, [handleOpenClientHtmlReport]);

    const inviterName =
        referralPreview?.agent?.display_name?.trim() ||
        [referralPreview?.agent?.first_name, referralPreview?.agent?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();

    return (
        <div
            className={`b2c-guest-plan${view === 'welcome' ? ' b2c-guest-plan--welcome' : ''}${view === 'cjm' || showOrchestrator ? ' b2c-guest-plan--cjm' : ''}${showDesktopResult ? ' b2c-guest-plan--result' : ''}${showOrchestrator ? ' b2c-guest-plan--orchestrator' : ''}`}
        >
            {!showDesktopResult && !showOrchestrator ? (
                <header className="b2c-guest-plan__header">
                    <div className="b2c-guest-plan__brand">
                        <img
                            src={b2cVisualAssets.familyOfficeLogo}
                            alt=""
                            className="b2c-guest-plan__brand-logo"
                            width={40}
                            height={40}
                        />
                        <span className="b2c-guest-plan__brand-title">Family Office</span>
                    </div>
                    <div className="b2c-guest-plan__header-end">
                        {inviterName && view !== 'welcome' ? (
                            <div className="b2c-guest-plan__invite">
                                Вас пригласил <strong>{inviterName}</strong>
                            </div>
                        ) : null}
                        <button type="button" className="b2c-guest-plan__login" disabled title="Скоро">
                            <User size={18} strokeWidth={2} aria-hidden />
                            <span className="b2c-guest-plan__login-text">Войти в кабинет</span>
                        </button>
                    </div>
                    {referralError ? <div className="b2c-guest-plan__invite-error">{referralError}</div> : null}
                </header>
            ) : null}

            <main className="b2c-guest-plan__main">
                {saveNotice ? <div className="b2c-guest-plan__notice">{saveNotice}</div> : null}
                {showDesktopResult && referralError ? (
                    <div className="b2c-guest-plan__invite-error" style={{ margin: '12px 28px 0' }}>
                        {referralError}
                    </div>
                ) : null}

                {view === 'welcome' && !orchestratorEnabled ? (
                    <B2cClientWelcome
                        inviterName={inviterName || undefined}
                        onStart={() => {
                            setView('cjm');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                ) : showOrchestrator ? (
                    <B2cPlanOrchestratorFlow
                        projectKey={attribution.project_key}
                        inviterName={inviterName || undefined}
                        isPlanSaved={isPlanSaved}
                        calculationResult={calculationResult}
                        onComplete={handleCjmComplete}
                        onSavePlan={isPlanSaved ? undefined : handleSavePlan}
                        onOpenHtmlReport={isPlanSaved ? handleOpenClientHtmlReport : undefined}
                        onOpenPdfReport={isPlanSaved ? handleOpenClientPdfReport : undefined}
                        onRestart={() => {
                            setSaveNotice(null);
                            setView('welcome');
                        }}
                        forceResultView={view === 'result'}
                    />
                ) : view === 'cjm' ? (
                    <CJMFlow
                        mode="guest"
                        projectKey={attribution.project_key}
                        inviterName={inviterName || undefined}
                        onComplete={handleCjmComplete}
                        onBack={() => setView('welcome')}
                    />
                ) : showDesktopResult ? (
                    <B2cResultDashboard
                        data={calculationResult}
                        inviterName={inviterName || undefined}
                        isPlanSaved={isPlanSaved}
                        onSavePlan={isPlanSaved ? undefined : handleSavePlan}
                        onOpenHtmlReport={isPlanSaved ? handleOpenClientHtmlReport : undefined}
                        onOpenPdfReport={isPlanSaved ? handleOpenClientPdfReport : undefined}
                        onRestart={() => {
                            setSaveNotice(null);
                            setView('welcome');
                        }}
                        restartLabel="Изменить анкету"
                    />
                ) : (
                    <ResultPage
                        data={calculationResult}
                        guestMode={!isPlanSaved}
                        onSavePlan={isPlanSaved ? undefined : handleSavePlan}
                        onGoToReport={isPlanSaved ? handleOpenClientReport : undefined}
                        onOpenHtmlReport={isPlanSaved ? handleOpenClientHtmlReport : undefined}
                        onOpenPdfReport={isPlanSaved ? handleOpenClientPdfReport : undefined}
                        onRestart={() => {
                            setSaveNotice(null);
                            setView('welcome');
                        }}
                        restartLabel="Изменить анкету"
                    />
                )}
            </main>

            <B2cClientPlanSaveModal
                isOpen={planSaveOpen}
                onClose={() => setPlanSaveOpen(false)}
                attribution={attribution}
                inviterName={inviterName || undefined}
                onSuccess={handlePlanSaveSuccess}
            />
        </div>
    );
};

export default B2cGuestPlanPage;
