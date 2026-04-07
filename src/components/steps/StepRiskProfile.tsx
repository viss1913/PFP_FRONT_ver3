import React, { useMemo } from 'react';
import type { CJMData } from '../CJMFlow';
import { Loader2 } from 'lucide-react';

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

    const summary = useMemo(() => {
        const total = Object.values(answers).reduce((sum, value) => sum + (value || 0), 0);
        const average = total / Math.max(1, answeredCount);
        if (average >= 4) return { profile: 'AGGRESSIVE' as const, label: 'Агрессивный' };
        if (average >= 2.5) return { profile: 'BALANCED' as const, label: 'Умеренный' };
        return { profile: 'CONSERVATIVE' as const, label: 'Консервативный' };
    }, [answers, answeredCount]);

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
    };

    return (
        <div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Риск-профиль клиента</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>
                Вопрос `q1` бэк вычислит сам из срока цели. Заполни `q2-q10`, это обязательно.
            </p>
            <div style={{
                marginBottom: 18,
                padding: 14,
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)'
            }}>
                Прогресс: {answeredCount}/9. Итоговый профиль: <b>{summary.label}</b>
            </div>

            <div style={{ display: 'grid', gap: 14, marginBottom: 26 }}>
                {questions.map((q) => (
                    <div key={q.id} style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                        <div style={{ marginBottom: 10, fontWeight: 600 }}>{q.text}</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {q.options.map((option, index) => {
                                const points = index + 1;
                                const active = answers[q.id] === points;
                                return (
                                    <button
                                        key={`${q.id}_${points}`}
                                        type="button"
                                        onClick={() => setAnswer(q.id, points)}
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
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={onPrev} disabled={loading}>Назад</button>
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
