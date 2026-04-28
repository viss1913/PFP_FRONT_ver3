import React, { useState, useEffect, useRef } from 'react';
import type { CJMData } from '../CJMFlow';
import avatarImage from '../../assets/avatar_full.png';
import type { RiskQuestionnaire } from '../../api/clientApi';

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
    /** Без этого при вызове onComplete сразу после setData родитель ещё со старым data — расчёт отваливается по проверке анкеты. */
    const pendingCompleteRef = useRef(false);

    useEffect(() => {
        const nextIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
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
        if (!allAnswered) {
            pendingCompleteRef.current = false;
            return;
        }
        if (loading) return;
        if (!pendingCompleteRef.current) return;
        pendingCompleteRef.current = false;
        onComplete();
    }, [allAnswered, loading, onComplete]);

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
            pendingCompleteRef.current = true;
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
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
                Прогресс: {answeredCount}/{questions.length || 0}
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
                <button className="btn-secondary" style={{ flex: 1, minWidth: 120 }} onClick={onPrev} disabled={loading}>Назад</button>
                {currentQuestionIndex > 0 && (
                    <button
                        className="btn-secondary"
                        style={{ flex: 1, minWidth: 120 }}
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={loading || questions.length === 0}
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
                        disabled={loading || questions.length === 0}
                    >
                        Рассчитать план
                    </button>
                )}
            </div>
            {loading && (
                <p style={{ marginTop: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
                    Считаем план…
                </p>
            )}
        </div>
    );
};

export default StepRiskProfile;
