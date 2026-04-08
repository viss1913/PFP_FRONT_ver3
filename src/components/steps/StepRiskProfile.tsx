import React, { useState, useEffect } from 'react';
import type { CJMData } from '../CJMFlow';
import { Loader2 } from 'lucide-react';
import avatarImage from '../../assets/avatar_full.png';

interface StepProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onComplete: () => void;
    onPrev: () => void;
    loading: boolean;
}

const questions = [
    {
        id: 'q2',
        text: 'Какую просадку капитала за год вы считаете допустимой?',
        options: ['Менее 5%', '5–10%', '10–20%', '20–30%', 'Более 30%']
    },
    {
        id: 'q3',
        text: 'Если ваши инвестиции упадут на 20%, что вы сделаете?',
        options: ['Продам, чтобы избежать убытков', 'Частично продам', 'Ничего не изменю', 'Докуплю на просадке', 'Буду рад возможности для увеличения капитала']
    },
    {
        id: 'q4',
        text: 'Какую долю своих сбережений вы готовы инвестировать?',
        options: ['Менее 20%', '20–40%', '40–60%', '60–80%', 'Более 80%']
    },
    {
        id: 'q5',
        text: 'Какие у вас финансовые обязательства?',
        options: ['Есть крупные обязательства (ипотека/кредит/дети)', 'Есть регулярные обязательства, ощутимая нагрузка', 'Есть мелкие обязательства', 'Почти нет обязательств', 'Нет обязательств']
    },
    {
        id: 'q6',
        text: 'Какая минимальная доходность для вас приемлема?',
        options: ['Менее 7% годовых', '7–10% годовых', '10–15% годовых', '15–20% годовых', 'Более 20% годовых']
    },
    {
        id: 'q7',
        text: 'Какой у вас опыт инвестирования?',
        options: ['Нет опыта', 'Есть небольшой опыт', 'Средний опыт', 'Продвинутый инвестор', 'Профессионал']
    },
    {
        id: 'q8',
        text: 'Что для вас важнее?',
        options: ['Только сохранение капитала', 'Скорее сохранение, чем доходность', 'Баланс между риском и доходностью', 'Скорее доходность', 'Только максимальная доходность']
    },
    {
        id: 'q9',
        text: 'Как реагируете на рыночные новости?',
        options: ['Переживаю и паникую', 'Нервничаю, иногда фиксирую убытки', 'Слежу спокойно', 'Почти не обращаю внимания', 'Радуюсь рыночным возможностям']
    },
    {
        id: 'q10',
        text: 'Как распоряжаетесь прибылью?',
        options: ['Фиксирую сразу', 'Чаще фиксирую', 'Оставляю в портфеле', 'Держу до конца периода', 'Даю расти без ограничений']
    }
] as const;

const StepRiskProfile: React.FC<StepProps> = ({ data, setData, onComplete, onPrev, loading }) => {
    const answers = data.riskProfileAnswers || {};
    const answeredCount = questions.filter((q) => typeof answers[q.id] === 'number').length;
    const allAnswered = answeredCount === questions.length;
    const firstUnansweredIndex = questions.findIndex((q) => typeof answers[q.id] !== 'number');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);

    useEffect(() => {
        if (allAnswered) return;
        if (typeof answers[questions[currentQuestionIndex].id] === 'number') {
            const nextIdx = questions.findIndex((q) => typeof answers[q.id] !== 'number');
            if (nextIdx >= 0) setCurrentQuestionIndex(nextIdx);
        }
    }, [answers, currentQuestionIndex, allAnswered]);

    const setAnswer = (questionId: string, points: number) => {
        setData((prev) => {
            const nextAnswers = {
                ...prev.riskProfileAnswers,
                [questionId]: points
            };
            const total = Object.values(nextAnswers).reduce((sum: number, value) => sum + (value || 0), 0);
            const answered = Object.values(nextAnswers).filter((value) => typeof value === 'number').length || 1;
            const avg = total / answered;
            const nextProfile = avg >= 4 ? 'AGGRESSIVE' : avg >= 2.5 ? 'BALANCED' : 'CONSERVATIVE';
            return {
                ...prev,
                riskProfile: nextProfile,
                riskProfileAnswers: nextAnswers
            };
        });

        const currentIdx = questions.findIndex((q) => q.id === questionId);
        const nextIdx = questions.findIndex((q, idx) => idx > currentIdx && typeof answers[q.id] !== 'number');
        if (nextIdx >= 0) setCurrentQuestionIndex(nextIdx);
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
                        Что бы правильно создать финансовый план, надо обязательно сделать Риск-профилирование.
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
                Прогресс: {answeredCount}/9
            </div>

            <div style={{ marginBottom: 26 }}>
                <div style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                    <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                        Вопрос {currentQuestionIndex + 1} из {questions.length}
                    </div>
                    <div style={{ marginBottom: 10, fontWeight: 600 }}>{currentQuestion.text}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {currentQuestion.options.map((option, index) => {
                            const points = index + 1;
                            const active = answers[currentQuestion.id] === points;
                            return (
                                <button
                                    key={`${currentQuestion.id}_${points}`}
                                    type="button"
                                    onClick={() => setAnswer(currentQuestion.id, points)}
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
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={onPrev} disabled={loading}>Назад</button>
                {!allAnswered && currentQuestionIndex > 0 && (
                    <button
                        className="btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={loading}
                    >
                        Предыдущий вопрос
                    </button>
                )}
                <button
                    className="btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={onComplete}
                    disabled={loading || !allAnswered}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Рассчитать план'}
                </button>
            </div>
        </div>
    );
};

export default StepRiskProfile;
