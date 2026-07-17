import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CJMFlow, { type CJMCompleteContext, type CJMFlowOrchestratorConfig } from '../CJMFlow';
import B2cPlanChat from './B2cPlanChat';
import B2cPlanOrchestratorShell from './B2cPlanOrchestratorShell';
import B2cPlanWelcomeStage from './B2cPlanWelcomeStage';
import B2cResultDashboard from './B2cResultDashboard';
import ResultPage from '../ResultPage';
import { b2cOrchestratorApi } from '../../api/b2cOrchestratorApi';
import {
    B2C_PLAN_DEFAULT_STAGE_KEY,
    getPageForStageKey,
    getStageDefinition,
    mergeStagesFromApi,
} from '../../config/b2cPlanStageRegistry';
import { useB2cPlanOrchestrator } from '../../hooks/useB2cPlanOrchestrator';
import type { B2cPlanSessionContext, B2cPlanUiEventPayload } from '../../types/b2cOrchestrator';

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

export interface B2cPlanOrchestratorFlowProps {
    projectKey: string;
    inviterName?: string;
    /** Referral agent context — sent on every orchestrator turn. */
    sessionContext?: B2cPlanSessionContext | null;
    isPlanSaved: boolean;
    calculationResult: unknown;
    forceResultView?: boolean;
    onComplete: (result: unknown, context?: CJMCompleteContext) => void;
    onSavePlan?: () => void;
    onOpenHtmlReport?: () => void;
    onOpenPdfReport?: () => void;
    onRestart?: () => void;
}

const B2cPlanOrchestratorFlow: React.FC<B2cPlanOrchestratorFlowProps> = ({
    projectKey,
    inviterName,
    sessionContext = null,
    isPlanSaved,
    calculationResult,
    forceResultView = false,
    onComplete,
    onSavePlan,
    onOpenHtmlReport,
    onOpenPdfReport,
    onRestart,
}) => {
    const isDesktopResult = useDesktopResultLayout();
    const [localResult, setLocalResult] = useState<unknown>(calculationResult);

    const orchestrator = useB2cPlanOrchestrator({
        projectKey,
        initialStageKey: B2C_PLAN_DEFAULT_STAGE_KEY,
        sessionContext,
    });

    const {
        messages,
        isStreaming,
        currentStageKey,
        error,
        assistantSettings,
        sendMessage,
        sendUiEvent,
        clearError,
        setStageKey,
    } = orchestrator;

    useEffect(() => {
        setLocalResult(calculationResult);
    }, [calculationResult]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const stages = await b2cOrchestratorApi.getPlanStages(projectKey);
                if (!cancelled && stages.length > 0) {
                    mergeStagesFromApi(stages);
                }
            } catch (e) {
                console.warn('[B2cPlanOrchestratorFlow] stages', e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectKey]);

    const stageDef = useMemo(() => getStageDefinition(currentStageKey), [currentStageKey]);
    const page = getPageForStageKey(currentStageKey);

    const lastAssistantMessage = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            if (messages[i].role === 'assistant' && messages[i].content.trim()) {
                return messages[i].content;
            }
        }
        return undefined;
    }, [messages]);

    const handleUiEvent = useCallback(
        (payload: Omit<B2cPlanUiEventPayload, 'page'> & { page?: string }) => {
            void sendUiEvent({
                ...payload,
                page: payload.page ?? page,
            });
        },
        [page, sendUiEvent],
    );

    const buildOrchestratorConfig = useCallback(
        (cjmStep: number): CJMFlowOrchestratorConfig => ({
            page,
            controlledStep: cjmStep,
            liveCoachMessage: lastAssistantMessage,
            onPageSubmit: (submitPage, pageData) => {
                void handleUiEvent({ event: 'page_submit', page: submitPage, page_data: pageData });
            },
            onGoalSelected: (payload) => {
                void handleUiEvent({
                    event: 'goal_selected',
                    page: payload.page,
                    goal_type_id: payload.goal_type_id,
                    goal_name: payload.goal_name,
                });
            },
        }),
        [handleUiEvent, lastAssistantMessage, page],
    );

    const handleCjmComplete = useCallback(
        (result: unknown, context?: CJMCompleteContext) => {
            setLocalResult(result);
            setStageKey('/result');
            onComplete(result, context);
        },
        [onComplete, setStageKey],
    );

    const handleWelcomeStart = useCallback(() => {
        void sendMessage('Хочу составить персональный финансовый план');
    }, [sendMessage]);

    const showResult = Boolean(localResult) && (forceResultView || stageDef.kind === 'result');
    const showDesktopResult = showResult && isDesktopResult;

    const chatPanel = (
        <B2cPlanChat
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            assistantSettings={assistantSettings}
            onSend={(text) => void sendMessage(text)}
            onClearError={clearError}
        />
    );

    let content: React.ReactNode;

    if (showDesktopResult) {
        content = (
            <B2cResultDashboard
                data={localResult}
                inviterName={inviterName}
                isPlanSaved={isPlanSaved}
                onSavePlan={isPlanSaved ? undefined : onSavePlan}
                onOpenHtmlReport={isPlanSaved ? onOpenHtmlReport : undefined}
                onOpenPdfReport={isPlanSaved ? onOpenPdfReport : undefined}
                onRestart={onRestart ?? (() => undefined)}
                restartLabel="Изменить анкету"
            />
        );
    } else if (showResult && !showDesktopResult) {
        content = (
            <ResultPage
                data={localResult}
                guestMode={!isPlanSaved}
                onSavePlan={isPlanSaved ? undefined : onSavePlan}
                onGoToReport={isPlanSaved ? onOpenHtmlReport : undefined}
                onOpenHtmlReport={isPlanSaved ? onOpenHtmlReport : undefined}
                onOpenPdfReport={isPlanSaved ? onOpenPdfReport : undefined}
                onRestart={onRestart ?? (() => undefined)}
                restartLabel="Изменить анкету"
            />
        );
    } else if (stageDef.kind === 'cjm' && stageDef.cjmStep) {
        content = (
            <CJMFlow
                mode="guest"
                projectKey={projectKey}
                inviterName={inviterName}
                onComplete={handleCjmComplete}
                orchestrator={buildOrchestratorConfig(stageDef.cjmStep)}
                hideGuestSidebar
            />
        );
    } else if (stageDef.kind === 'unknown') {
        content = (
            <div className="b2c-plan-unknown-stage" role="status">
                <h2 className="b2c-plan-unknown-stage__title">
                    {stageDef.title || currentStageKey}
                </h2>
                <p className="b2c-plan-unknown-stage__text">
                    Экран для команды <code>{currentStageKey}</code> ещё не подключён во фронте.
                    Можно продолжить в чате — ассистент подскажет следующий шаг.
                </p>
            </div>
        );
    } else {
        content = <B2cPlanWelcomeStage onStart={handleWelcomeStart} isStreaming={isStreaming} />;
    }

    if (showDesktopResult) {
        return <div className="b2c-plan-orchestrator b2c-plan-orchestrator--result-only">{content}</div>;
    }

    return (
        <B2cPlanOrchestratorShell
            chat={chatPanel}
            variant={stageDef.kind === 'welcome' ? 'welcome' : 'split'}
        >
            {content}
        </B2cPlanOrchestratorShell>
    );
};

export default B2cPlanOrchestratorFlow;
