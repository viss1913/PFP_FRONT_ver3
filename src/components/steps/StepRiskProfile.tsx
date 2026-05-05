import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import avatarImage from '../../assets/avatar_full.png';
import type { RiskQuestionnaire } from '../../api/clientApi';

const HANDOFF_MS = 640;
const MOTION_EASE = [0.4, 0, 0.2, 1] as const;

interface StepProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onComplete: () => void;
    onPrev: () => void;
    loading: boolean;
    questionnaire: RiskQuestionnaire | null;
    isQuestionnaireLoading: boolean;
}

const StepRiskProfile: React.FC<StepProps> = ({
    data,
    setData,
    onComplete,
    onPrev,
    loading,
    questionnaire,
    isQuestionnaireLoading,
}) => {
    const questions = React.useMemo(() => {
        const source = questionnaire?.questions || [];
        return [...source]
            .sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER))
            .map((question) => ({
                ...question,
                options: [...(question.options || [])].sort(
                    (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)
                )
            }));
    }, [questionnaire]);
    const answers = data.riskProfileAnswers || {};
    const answeredCount = questions.filter((q) => typeof answers[q.code] === 'string').length;
    const allAnswered = questions.length > 0 && answeredCount === questions.length;
    const firstUnansweredIndex = questions.findIndex((q) => typeof answers[q.code] !== 'string');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);
    /** После последнего ответа — короткий экран «готово», потом вызов расчёта (чтобы data успел обновиться). */
    const [handoffAfterLastAnswer, setHandoffAfterLastAnswer] = useState(false);

    useEffect(() => {
        const nextIndex =
            firstUnansweredIndex >= 0
                ? firstUnansweredIndex
                : questions.length > 0
                  ? questions.length - 1
                  : 0;
        setCurrentQuestionIndex(nextIndex);
    }, [firstUnansweredIndex, questions.length]);

    useEffect(() => {
        if (allAnswered || questions.length === 0) return;
        if (typeof answers[questions[currentQuestionIndex]?.code] === 'string') {
            const nextIdx = questions.findIndex((q) => typeof answers[q.code] !== 'string');
            if (nextIdx >= 0) setCurrentQuestionIndex(nextIdx);
        }
    }, [answers, currentQuestionIndex, allAnswered, questions]);

    useEffect(() => {
        if (loading) {
            setHandoffAfterLastAnswer(false);
        }
    }, [loading]);

    useEffect(() => {
        if (!handoffAfterLastAnswer || !allAnswered || loading) return;
        const t = window.setTimeout(() => {
            onComplete();
        }, HANDOFF_MS);
        return () => window.clearTimeout(t);
    }, [handoffAfterLastAnswer, allAnswered, loading, onComplete]);

    const setAnswer = (questionCode: string, optionCode: string) => {
        setData((prev) => {
            const nextAnswers = {
                ...prev.riskProfileAnswers,
                [questionCode]: optionCode
            };
            return {
                ...prev,
                riskProfileAnswers: nextAnswers
            };
        });

        const currentIdx = questions.findIndex((q) => q.code === questionCode);
        const nextIdx = questions.findIndex((q, idx) => idx > currentIdx && typeof answers[q.code] !== 'string');
        if (nextIdx >= 0) setCurrentQuestionIndex(nextIdx);

        const wasAllAnswered = questions.every((q) => typeof answers[q.code] === 'string');
        const willCompleteAll = questions.every((q) =>
            q.code === questionCode ? true : typeof answers[q.code] === 'string'
        );
        if (!wasAllAnswered && willCompleteAll && !loading) {
            setHandoffAfterLastAnswer(true);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];
    const visualProgress = questions.length > 0 ? currentQuestionIndex + 1 : 0;

    const phase: 'form' | 'handoff' | 'loading' = loading ? 'loading' : handoffAfterLastAnswer ? 'handoff' : 'form';
    const blockBusy = loading || handoffAfterLastAnswer;

    const loaderBlock = (
        <motion.div
            key="loader"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: MOTION_EASE }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '32px 16px 48px',
                minHeight: 380,
                gap: 24,
            }}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.35, ease: MOTION_EASE }}
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    background: '#fff',
                }}
            >
                <img src={avatarImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, rgba(255,199,80,0.22) 0%, rgba(0,168,177,0.12) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -8,
                }}
            >
                <Loader2 className="animate-spin" size={36} color="var(--secondary, #00A8B1)" strokeWidth={2.2} />
            </div>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>
                    Считаем персональный план
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.55 }}>
                    Учитываем ответы по риск-профилю, цели и капитал. Обычно это несколько секунд.
                </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="risk-loader-dot"
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );

    const handoffBlock = (
        <motion.div
            key="handoff"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.38, ease: MOTION_EASE }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px 56px',
                minHeight: 380,
                gap: 20,
            }}
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(0,168,177,0.12) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CheckCircle2 size={44} color="var(--accent-green, #10B981)" strokeWidth={2.2} />
            </motion.div>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Готово</h2>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>
                    Риск-профиль заполнен. Сейчас запустим расчёт персонального плана.
                </p>
            </div>
            <div
                style={{
                    width: 200,
                    height: 3,
                    borderRadius: 3,
                    background: 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    alignSelf: 'center',
                }}
            >
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: HANDOFF_MS / 1000, ease: 'linear' }}
                    style={{
                        height: '100%',
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                    }}
                />
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence mode="wait">
            {phase === 'loading' ? (
                loaderBlock
            ) : phase === 'handoff' ? (
                handoffBlock
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16, filter: 'blur(3px)' }}
                    transition={{ duration: 0.32, ease: MOTION_EASE }}
                >
        <div>
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '32px'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        minWidth: '120px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        background: '#fff'
                    }}>
                        <img src={avatarImage} alt="AI Assistant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{
                        background: '#fff',
                        borderRadius: '24px',
                        borderTopLeftRadius: '4px',
                        padding: '28px',
                        fontSize: '18px',
                        lineHeight: '1.5',
                        color: '#1F2937',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: '620px',
                        fontWeight: '500'
                    }}>
                        Чтобы правильно создать финансовый план, надо обязательно сделать Риск-профилирование.
                        {questionnaire?.description ? (
                            <div style={{ marginTop: 8, fontSize: 14, color: '#4B5563' }}>
                                {questionnaire.description}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <div style={{
                marginBottom: 18,
                padding: 14,
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)'
            }}>
                Прогресс: {visualProgress}/{questions.length || 0}
            </div>

            {isQuestionnaireLoading && (
                <p style={{ marginBottom: 26, color: 'var(--text-muted)' }}>Загружаем анкету риск-профиля…</p>
            )}
            {!isQuestionnaireLoading && questions.length === 0 && (
                <p style={{ marginBottom: 26, color: 'var(--text-muted)' }}>
                    Не удалось получить анкету риск-профиля. Попробуй обновить страницу.
                </p>
            )}

            <div style={{ marginBottom: 26 }}>
                <div style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                    <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                        Вопрос {questions.length > 0 ? currentQuestionIndex + 1 : 0} из {questions.length}
                    </div>
                    <div style={{ marginBottom: 10, fontWeight: 600 }}>{currentQuestion?.title}</div>
                    {currentQuestion?.description && (
                        <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>{currentQuestion.description}</div>
                    )}
                    {currentQuestion?.help_text && (
                        <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--text-muted)' }}>{currentQuestion.help_text}</div>
                    )}
                    <div style={{ display: 'grid', gap: 8 }}>
                        {currentQuestion?.options?.map((option) => {
                            const active = answers[currentQuestion.code] === option.code;
                            return (
                                <button
                                    key={`${currentQuestion.code}_${option.code}`}
                                    type="button"
                                    onClick={() => setAnswer(currentQuestion.code, option.code)}
                                    style={{
                                        textAlign: 'left',
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                        border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                        background: active ? 'rgba(255,199,80,0.17)' : 'rgba(255,255,255,0.02)',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1, minWidth: 120 }} onClick={onPrev} disabled={blockBusy}>Назад</button>
                {currentQuestionIndex > 0 && (
                    <button
                        className="btn-secondary"
                        style={{ flex: 1, minWidth: 120 }}
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={blockBusy || questions.length === 0}
                    >
                        Предыдущий вопрос
                    </button>
                )}
                {allAnswered && (
                    <button
                        className="btn-primary"
                        type="button"
                        style={{ flex: '1 1 100%', minWidth: 200 }}
                        onClick={() => onComplete()}
                        disabled={blockBusy || questions.length === 0}
                    >
                        Рассчитать план
                    </button>
                )}
            </div>
        </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StepRiskProfile;
