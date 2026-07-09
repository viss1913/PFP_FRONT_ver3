import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Clock,
    Loader2,
    Shield,
    ShieldCheck,
    Target,
} from 'lucide-react';
import type { RiskQuestionnaireQuestion } from '../../api/clientApi';
import { b2cVisualAssets } from '../../content/b2cAssets';
import {
    B2C_RISK_PROFILE_FORM,
    B2C_RISK_PROFILE_WHY_BULLETS,
} from '../../content/b2cRiskProfileStepCopy';

const MOTION_EASE = [0.4, 0, 0.2, 1] as const;
const HANDOFF_MS = 640;

export type B2cRiskPhase = 'form' | 'handoff' | 'loading';

interface B2cStepRiskProfileProps {
    questions: RiskQuestionnaireQuestion[];
    answers: Record<string, string>;
    currentQuestionIndex: number;
    phase: B2cRiskPhase;
    isQuestionnaireLoading: boolean;
    blockBusy: boolean;
    allAnswered: boolean;
    onSelectAnswer: (questionCode: string, optionCode: string) => void;
    onPrevQuestion: () => void;
    onNextQuestion: () => void;
    onPrevStep: () => void;
    onComplete: () => void;
}

const whyIcon = (icon: (typeof B2C_RISK_PROFILE_WHY_BULLETS)[number]['icon']) => {
    switch (icon) {
        case 'target':
            return <Target size={16} strokeWidth={2.25} aria-hidden />;
        case 'shield':
            return <Shield size={16} strokeWidth={2.25} aria-hidden />;
        case 'chart':
            return <BarChart3 size={16} strokeWidth={2.25} aria-hidden />;
        default:
            return null;
    }
};

const B2cStepRiskProfile: React.FC<B2cStepRiskProfileProps> = ({
    questions,
    answers,
    currentQuestionIndex,
    phase,
    isQuestionnaireLoading,
    blockBusy,
    allAnswered,
    onSelectAnswer,
    onPrevQuestion,
    onNextQuestion,
    onPrevStep,
    onComplete,
}) => {
    const total = questions.length;
    const visualProgress = total > 0 ? currentQuestionIndex + 1 : 0;
    const progressPct = total > 0 ? Math.round((visualProgress / total) * 100) : 0;
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswered =
        currentQuestion != null && typeof answers[currentQuestion.code] === 'string';
    const canGoNext = currentAnswered || allAnswered;
    const isLastQuestion = total > 0 && currentQuestionIndex >= total - 1;

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            onPrevQuestion();
            return;
        }
        onPrevStep();
    };

    const handleNext = () => {
        if (!canGoNext || blockBusy) return;
        if (allAnswered && (isLastQuestion || currentAnswered)) {
            onComplete();
            return;
        }
        if (currentAnswered && !isLastQuestion) {
            onNextQuestion();
        }
    };

    const loaderBlock = (
        <motion.div
            key="loader"
            className="b2c-step-risk__status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: MOTION_EASE }}
        >
            <div className="b2c-step-risk__status-spinner" aria-hidden>
                <Loader2 className="animate-spin" size={36} strokeWidth={2.2} />
            </div>
            <h2 className="b2c-step-risk__status-title">{B2C_RISK_PROFILE_FORM.calculatingTitle}</h2>
            <p className="b2c-step-risk__status-text">{B2C_RISK_PROFILE_FORM.calculatingText}</p>
        </motion.div>
    );

    const handoffBlock = (
        <motion.div
            key="handoff"
            className="b2c-step-risk__status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: MOTION_EASE }}
        >
            <div className="b2c-step-risk__status-ok" aria-hidden>
                <CheckCircle2 size={40} strokeWidth={2.2} />
            </div>
            <h2 className="b2c-step-risk__status-title">{B2C_RISK_PROFILE_FORM.handoffTitle}</h2>
            <p className="b2c-step-risk__status-text">{B2C_RISK_PROFILE_FORM.handoffText}</p>
            <div className="b2c-step-risk__handoff-bar" aria-hidden>
                <motion.div
                    className="b2c-step-risk__handoff-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: HANDOFF_MS / 1000, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );

    return (
        <div className="b2c-step-risk">
            <AnimatePresence mode="wait">
                {phase === 'loading' ? (
                    loaderBlock
                ) : phase === 'handoff' ? (
                    handoffBlock
                ) : (
                    <motion.div
                        key="form"
                        className="b2c-step-risk__card"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.28, ease: MOTION_EASE }}
                    >
                        <div className="b2c-step-risk__main">
                            <header className="b2c-step-risk__header">
                                <div className="b2c-step-risk__header-copy">
                                    <p className="b2c-step-risk__eyebrow">
                                        <ShieldCheck size={16} strokeWidth={2.25} aria-hidden />
                                        {B2C_RISK_PROFILE_FORM.eyebrow}
                                    </p>
                                    <h2 className="b2c-step-risk__title">{B2C_RISK_PROFILE_FORM.title}</h2>
                                    <p className="b2c-step-risk__subtitle">
                                        {B2C_RISK_PROFILE_FORM.description}
                                    </p>
                                </div>
                                <div className="b2c-step-risk__hero">
                                    <img
                                        src={b2cVisualAssets.riskProfileHero}
                                        alt=""
                                        className="b2c-step-risk__hero-image"
                                    />
                                </div>
                            </header>

                            <div className="b2c-step-risk__progress">
                                <div className="b2c-step-risk__progress-label">
                                    {B2C_RISK_PROFILE_FORM.progressLabel(visualProgress, total)}
                                </div>
                                <div
                                    className="b2c-step-risk__progress-track"
                                    role="progressbar"
                                    aria-valuenow={visualProgress}
                                    aria-valuemin={0}
                                    aria-valuemax={total || 1}
                                >
                                    <div
                                        className="b2c-step-risk__progress-fill"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>

                            {isQuestionnaireLoading && (
                                <p className="b2c-step-risk__hint">
                                    {B2C_RISK_PROFILE_FORM.loadingQuestionnaire}
                                </p>
                            )}
                            {!isQuestionnaireLoading && total === 0 && (
                                <p className="b2c-step-risk__hint">
                                    {B2C_RISK_PROFILE_FORM.emptyQuestionnaire}
                                </p>
                            )}

                            {currentQuestion ? (
                                <div className="b2c-step-risk__question-block">
                                    <p className="b2c-step-risk__question-meta">
                                        {B2C_RISK_PROFILE_FORM.questionLabel(
                                            currentQuestionIndex + 1,
                                            total,
                                        )}
                                    </p>
                                    <h3 className="b2c-step-risk__question-title">
                                        {currentQuestion.title}
                                    </h3>
                                    {currentQuestion.description ? (
                                        <p className="b2c-step-risk__question-desc">
                                            {currentQuestion.description}
                                        </p>
                                    ) : null}
                                    {currentQuestion.help_text ? (
                                        <p className="b2c-step-risk__question-help">
                                            {currentQuestion.help_text}
                                        </p>
                                    ) : null}

                                    <div
                                        className="b2c-step-risk__options"
                                        role="radiogroup"
                                        aria-label={currentQuestion.title}
                                    >
                                        {currentQuestion.options?.map((option) => {
                                            const active =
                                                answers[currentQuestion.code] === option.code;
                                            return (
                                                <button
                                                    key={`${currentQuestion.code}_${option.code}`}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={active}
                                                    className={`b2c-step-risk__option${active ? ' b2c-step-risk__option--active' : ''}`}
                                                    onClick={() =>
                                                        onSelectAnswer(
                                                            currentQuestion.code,
                                                            option.code,
                                                        )
                                                    }
                                                    disabled={blockBusy}
                                                >
                                                    <span
                                                        className="b2c-step-risk__radio"
                                                        aria-hidden
                                                    />
                                                    <span className="b2c-step-risk__option-label">
                                                        {option.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            <div className="b2c-step-risk__actions">
                                <button
                                    type="button"
                                    className="b2c-step-risk__back"
                                    onClick={handleBack}
                                    disabled={blockBusy}
                                >
                                    <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
                                    Назад
                                </button>
                                <button
                                    type="button"
                                    className="b2c-step-risk__next"
                                    onClick={handleNext}
                                    disabled={blockBusy || !canGoNext || total === 0}
                                >
                                    {allAnswered && isLastQuestion ? 'Рассчитать план' : 'Далее'}
                                    <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                                </button>
                            </div>
                        </div>

                        <aside className="b2c-step-risk__aside" aria-label="Зачем это нужно">
                            <div className="b2c-step-risk__aside-head">
                                <ShieldCheck size={18} strokeWidth={2.25} aria-hidden />
                                <h3 className="b2c-step-risk__aside-title">
                                    {B2C_RISK_PROFILE_FORM.whyTitle}
                                </h3>
                            </div>
                            <p className="b2c-step-risk__aside-text">
                                {B2C_RISK_PROFILE_FORM.whyText}
                            </p>
                            <ul className="b2c-step-risk__aside-list">
                                {B2C_RISK_PROFILE_WHY_BULLETS.map((item) => (
                                    <li key={item.id} className="b2c-step-risk__aside-item">
                                        <span className="b2c-step-risk__aside-icon" aria-hidden>
                                            {whyIcon(item.icon)}
                                        </span>
                                        <span>{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="b2c-step-risk__aside-time">
                                <Clock size={15} strokeWidth={2.25} aria-hidden />
                                <span>{B2C_RISK_PROFILE_FORM.timeEstimate}</span>
                            </p>
                        </aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default B2cStepRiskProfile;
